#!/usr/bin/env bash

IFS="," read -ra PORTS <<<"$WAIT_PORTS"
path=$(dirname "$0")

PIDs=()
for port in "${PORTS[@]}"; do
  "$path"/wait-for.sh -t 120 "http://195.80.50.221:$port/manage/health" -- echo "Host 195.80.50.221:$port is active" &
  PIDs+=($!)
done

for pid in "${PIDs[@]}"; do
  if ! wait "${pid}"; then
    exit 1
  fi
done
