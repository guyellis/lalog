/*

Stripped down and modified types for logging from @google-cloud/logging module.

*/

/** Properties of a MonitoredResource. */
export interface IMonitoredResource {

  /** MonitoredResource type */
  type?: (string|null);

  /** MonitoredResource labels */
  labels?: ({ [k: string]: string }|null);
}

const LogSeverity = {
  ALERT: 700,
  CRITICAL: 600,
  DEBUG: 100,
  DEFAULT: 0,
  EMERGENCY: 800,
  ERROR: 500,
  INFO: 200,
  NOTICE: 300,
  WARNING: 400,
};

export interface ILogEntry {

  /** LogEntry logName */
  logName?: (string|null);

  /** LogEntry resource */
  resource?: (IMonitoredResource|null);

  /** LogEntry protoPayload */
  // protoPayload?: (google.protobuf.IAny|null);

  /** LogEntry textPayload */
  textPayload?: (string|null);

  /** LogEntry jsonPayload */
  jsonPayload?: Record<string, unknown>;

  /** LogEntry timestamp */
  // timestamp?: (google.protobuf.ITimestamp|null);

  /** LogEntry receiveTimestamp */
  // receiveTimestamp?: (google.protobuf.ITimestamp|null);

  /** LogEntry severity */
  severity?: keyof typeof LogSeverity;

  /** LogEntry insertId */
  insertId?: (string|null);

  /** LogEntry httpRequest */
  // httpRequest?: (google.logging.type.IHttpRequest|null);

  /** LogEntry labels */
  labels?: ({ [k: string]: string }|null);

  /** LogEntry operation */
  // operation?: (google.logging.v2.ILogEntryOperation|null);

  /** LogEntry trace */
  trace?: (string|null);

  /** LogEntry spanId */
  spanId?: (string|null);

  /** LogEntry traceSampled */
  traceSampled?: (boolean|null);

  /** LogEntry sourceLocation */
  // sourceLocation?: (google.logging.v2.ILogEntrySourceLocation|null);

  /** LogEntry split */
  // split?: (google.logging.v2.ILogSplit|null);
}

export interface LogBody {
  entries: ILogEntry | ILogEntry[];
  severity?: string;
  resource?: IMonitoredResource;
  logName: string;
}
