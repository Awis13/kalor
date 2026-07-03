// Duepi EVO protocol client — TCP connection via cloud relay
// Protocol: ESC + "R" + cmd + checksum(2 hex) + "&"
// Response: 10 bytes ASCII

import * as net from "net";
import {
  CMD,
  ERROR_CODES,
  getStatusText,
  getStatusCode,
  isStoveOn,
} from "./duepi-constants";
import type { StoveState } from "./agua-types";

const ESC = "\x1b";
const RESPONSE_LENGTH = 10;
const SOCKET_TIMEOUT = 5000;
const COMMAND_DELAY = 200; // ms between commands

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Checksum: sum of ASCII codes of "R" + cmd, & 0xFF, in hex (2 chars)
function calcChecksum(cmd: string): string {
  const fullCmd = "R" + cmd;
  let sum = 0;
  for (let i = 0; i < fullCmd.length; i++) {
    sum += fullCmd.charCodeAt(i);
  }
  return (sum & 0xff).toString(16).padStart(2, "0").toUpperCase();
}

// Build the full command: ESC + R + cmd + checksum + &
function buildCommand(cmd: string): string {
  const checksum = calcChecksum(cmd);
  return ESC + "R" + cmd + checksum + "&";
}

// Command to set power: F00x0 where x = 0-5
function buildSetPowerCmd(level: number): string {
  const clamped = Math.max(0, Math.min(6, level));
  return `F00${clamped}0`;
}

// Command to set temperature: F2xx0 where xx = hex value
function buildSetTempCmd(temp: number): string {
  const clamped = Math.max(10, Math.min(35, Math.round(temp)));
  const hex = clamped.toString(16).padStart(2, "0").toUpperCase();
  return `F2${hex}0`;
}

export interface DuepiConfig {
  host: string;
  port: number;
  deviceCode: string;
}

export class DuepiClient {
  private config: DuepiConfig;
  private socket: net.Socket | null = null;
  private connected = false;
  private commandQueue: Array<{
    cmd: string;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];
  private processing = false;

  constructor(config: DuepiConfig) {
    this.config = config;
  }

  // Connect to the server + send the device code
  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected && this.socket) {
        resolve();
        return;
      }

      this.cleanup();

      const socket = new net.Socket();
      socket.setTimeout(SOCKET_TIMEOUT);

      socket.on("close", () => {
        this.connected = false;
        this.socket = null;
      });

      socket.on("timeout", () => {
        console.error("[Duepi] Socket timeout");
        this.cleanup();
      });

      socket.on("error", (err) => {
        console.error("[Duepi] Socket error:", err.message);
        this.cleanup();
        reject(new Error("Connection failed: " + err.message));
      });

      socket.connect(this.config.port, this.config.host, () => {
        this.socket = socket;
        this.connected = true;

        // Handshake: "master:" + deviceCode + "#"
        // Sniffed from the DP Remote app
        const handshake = `master:${this.config.deviceCode}#`;
        socket.write(handshake, (err) => {
          if (err) {
            this.cleanup();
            reject(new Error("Failed to send device code: " + err.message));
          } else {
            // Give the server time to process the device code
            setTimeout(() => resolve(), 500);
          }
        });
      });
    });
  }

  private cleanup() {
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch {
        // ignore
      }
      this.socket = null;
    }
    this.connected = false;
  }

  // Send a command and get the response
  private sendRaw(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error("Not connected"));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Command timeout"));
      }, SOCKET_TIMEOUT);

      let responseBuffer = "";

      const onData = (data: Buffer) => {
        responseBuffer += data.toString("ascii");
        // The response is always 10 bytes
        if (responseBuffer.length >= RESPONSE_LENGTH) {
          clearTimeout(timeout);
          this.socket?.removeListener("data", onData);
          resolve(responseBuffer.substring(0, RESPONSE_LENGTH));
        }
      };

      this.socket.on("data", onData);

      const fullCmd = buildCommand(cmd);
      this.socket.write(fullCmd, (err) => {
        if (err) {
          clearTimeout(timeout);
          this.socket?.removeListener("data", onData);
          reject(new Error("Write error: " + err.message));
        }
      });
    });
  }

  // Sequential command processing
  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.commandQueue.length > 0) {
      const item = this.commandQueue.shift()!;
      try {
        // Reconnect if the relay closed the socket between commands
        await this.ensureConnected();
        const response = await this.sendRaw(item.cmd);
        item.resolve(response);
      } catch (err) {
        item.reject(err instanceof Error ? err : new Error(String(err)));
      }
      await sleep(COMMAND_DELAY);
    }

    this.processing = false;
  }

  // Public method: send a command through the queue
  async sendCommand(cmd: string): Promise<string> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.commandQueue.push({ cmd, resolve, reject });
      this.processQueue();
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected || !this.socket) {
      await this.connect();
    }
  }

  // Parse the 4-char hex from the response (response[1:5])
  private parseValue(response: string): number {
    try {
      return parseInt(response.substring(1, 5), 16);
    } catch {
      return 0;
    }
  }

  // Parse the 8-char hex (response[1:9]) for status
  private parseState(response: string): number {
    try {
      return parseInt(response.substring(1, 9), 16);
    } catch {
      return 0;
    }
  }

  // Read a single register
  async readRegister(cmd: string): Promise<number> {
    const response = await this.sendCommand(cmd);
    return this.parseValue(response);
  }

  // Read status (32-bit)
  async readStatus(): Promise<number> {
    const response = await this.sendCommand(CMD.GET_STATUS);
    return this.parseState(response);
  }

  // ========== Public methods ==========

  // Get the full stove state
  // Commands run SEQUENTIALLY — serial protocol, one after another
  async getStoveState(): Promise<StoveState> {
    const statusRaw = this.parseState(await this.sendCommand(CMD.GET_STATUS));
    const roomTempRaw = await this.readRegister(CMD.GET_ROOM_TEMP);
    const fumesTempRaw = await this.readRegister(CMD.GET_FUMES_TEMP);
    const powerLevelRaw = await this.readRegister(CMD.GET_POWER_LEVEL);
    const pelletSpeedRaw = await this.readRegister(CMD.GET_PELLET_SPEED);
    const exhFanRaw = await this.readRegister(CMD.GET_EXH_FAN_RPM);
    const errorRaw = await this.readRegister(CMD.GET_ERROR);
    const setpointRaw = await this.readRegister(CMD.GET_SETPOINT);

    const roomTemp = roomTempRaw / 10;
    const fumesTemp = fumesTempRaw; // already in °C
    const powerLevel = powerLevelRaw;
    const exhFanRPM = exhFanRaw * 10;
    const statusCode = getStatusCode(statusRaw);

    return {
      status: statusCode,
      statusText: getStatusText(statusRaw),
      isOn: isStoveOn(statusRaw),

      roomTemp,
      targetTemp: setpointRaw,
      fumesTemp,
      waterTemp: 0, // Kalor Petit — air stove, no water circuit

      powerLevel,
      fanSpeed: exhFanRPM,

      waterPressure: 0,
      flamePower: pelletSpeedRaw, // pellet feed rate ≈ flame power
      pelletLoadTime: pelletSpeedRaw,
      cpuCounter: 0,

      alarmCode: errorRaw,
      alarmText: ERROR_CODES[errorRaw] || `Error ${errorRaw}`,
      hasAlarm: errorRaw > 0,

      isOnline: true,
      lastUpdate: Date.now(),

      rawRegisters: {
        status: statusRaw,
        room_temp: roomTempRaw,
        fumes_temp: fumesTempRaw,
        power_level: powerLevelRaw,
        pellet_speed: pelletSpeedRaw,
        exh_fan_rpm: exhFanRaw,
        error: errorRaw,
        setpoint: setpointRaw,
        room_temp_c: roomTemp,
        fumes_temp_c: fumesTemp,
        exh_fan_rpm_actual: exhFanRPM,
      },
    };
  }

  // Turn the stove on
  async powerOn(): Promise<void> {
    await this.sendCommand(CMD.SET_POWER_ON);
  }

  // Turn the stove off
  async powerOff(): Promise<void> {
    await this.sendCommand(CMD.SET_POWER_OFF);
  }

  // Set power level (0-5, 6=auto)
  async setPowerLevel(level: number): Promise<void> {
    const cmd = buildSetPowerCmd(level);
    await this.sendCommand(cmd);
  }

  // Set the target temperature
  async setTargetTemp(temp: number): Promise<void> {
    const cmd = buildSetTempCmd(temp);
    await this.sendCommand(cmd);
  }

  // Reset error
  async resetError(): Promise<void> {
    await this.sendCommand(CMD.RESET_ERROR);
  }

  // Close the connection
  disconnect() {
    this.cleanup();
    this.commandQueue = [];
  }
}
