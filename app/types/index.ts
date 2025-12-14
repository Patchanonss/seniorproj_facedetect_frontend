export interface Log {
  name: string;
  check_in_time: string;
  status: "PRESENT" | "LATE";
}

export interface ApiResponse {
  status: "active" | "inactive";
  session_id?: number;
  logs: Log[];
}
