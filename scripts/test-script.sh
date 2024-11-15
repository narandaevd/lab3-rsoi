#!/usr/bin/env bash

set -e

variant=${1:-${VARIANT}}
service=${2:-${SERVICE_NAME}}
port=${3:-${PORT_NUMBER}}

path=$(dirname "$0")

timed() {
  end=$(date +%s)
  dt=$(("$end" - $1))
  dd=$(("$dt" / 86400))
  dt2=$(("$dt" - 86400 * "$dd"))
  dh=$(("$dt2" / 3600))
  dt3=$(("$dt2" - 3600 * "$dh"))
  dm=$(("$dt3" / 60))
  ds=$(("$dt3" - 60 * "$dm"))

  LC_NUMERIC=C printf "\nTotal runtime: %02d min %02d seconds\n" "$dm" "$ds"
}

success() {
  newman run \
    --delay-request=100 \
    --folder=success \
    --export-environment "$variant"/postman/environment.json \
    --environment "$variant"/postman/environment.json \
    "$variant"/postman/collection.json
}

step() {
  local step=$1
  [[ $((step % 2)) -eq 0 ]] && operation="start" || operation="stop"

  printf "=== Step %d: %s %s ===\n" "$step" "$operation" "$service"

  # docker compose "$operation" "$service"
  # ssh root@195.80.50.221 "docker ps -q --filter \"ancestor=rsoi_lab2_$service\" | xargs docker $operation"
  # ssh root@195.80.50.221 "docker $operation rsoi_lab2_${service}_service"
  # echo "docker ${operation} rsoi_lab2_${service}_service"
  # echo "docker ${operation} rsoi_lab2_${service}_service" | ssh root@195.80.50.221
  if [[ "$operation" == "stop" ]]; then
    ssh root@195.80.50.221 "docker stop rsoi_lab2_loyalty_service"
  fi
  if [[ "$operation" == "start" ]]; then
    ssh root@195.80.50.221 "docker start rsoi_lab2_loyalty_service"
    "$path"/wait-for.sh -t 120 "http://195.80.50.221:$port/manage/health" -- echo "Host 195.80.50.221:$port is active"
  fi

  newman run \
    --delay-request=100 \
    --folder=step"$step" \
    --export-environment "$variant"/postman/environment.json \
    --environment "$variant"/postman/environment.json \
    "$variant"/postman/collection.json

  printf "=== Step %d completed ===\n" "$step"
}

start=$(date +%s)
trap 'timed $start' EXIT

printf "=== Start test scenario ===\n"

# success execute
success

# stop service
step 1

# start service
step 2

# stop service
step 3

# start service
step 4
