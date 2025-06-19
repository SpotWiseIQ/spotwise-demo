from fmiopendata.wfs import download_stored_query
from datetime import datetime, timezone
import json

# start_time = datetime.now(timezone.utc)
start_time=datetime(2025, 6, 21, 0, 0, 0, tzinfo=timezone.utc)
# Convert times to properly formatted strings
start_time = start_time.isoformat(timespec="seconds").replace("+00:00", "Z")


obs = download_stored_query(
    "ecmwf::forecast::surface::cities::multipointcoverage",
    args=["timeseries=True", f"starttime={start_time}"],
)

json_str = json.dumps(obs.data, default=str, indent=2)
json_obj = json.loads(json_str)

print(json_obj)

print(json_obj["Tampere"]["times"])
print(json_obj["Tampere"]["Air temperature"])

# with open("../../../data/fmiopendata_output.json", "w", encoding="utf-8") as f:
#     json.dump(obs.data, f, indent=2, default=str)  # default=str handles datetime and numpy types
