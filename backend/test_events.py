from app.database import generate_mock_events_for_date
from datetime import datetime

# Test generating events for today
today = datetime.now().date().strftime("%Y-%m-%d")
print(f"Testing event generation for date: {today}")

events = generate_mock_events_for_date(today)
print(f"Generated {len(events)} events:")

for event in events:
    print(f"\nEvent ID: {event.id}")
    print(f"  Name: {event.name}")
    print(f"  Time: {event.time}")
    print(f"  Type: {event.type}")
    print(f"  Place: {event.place}")
    print(f"  Address: {event.address}")
    print(f"  Duration: {event.duration}")
    print(f"  Ticket Status: {event.ticketStatus}")

# Test with another date to ensure it's different
test_date = "2025-01-01"
print(f"\n\nTesting event generation for date: {test_date}")

events2 = generate_mock_events_for_date(test_date)
print(f"Generated {len(events2)} events:")

for event in events2:
    print(f"\nEvent ID: {event.id}")
    print(f"  Name: {event.name}")
    print(f"  Time: {event.time}")
    print(f"  Type: {event.type}")
    print(f"  Place: {event.place}")
    print(f"  Address: {event.address}")

# Test caching behavior
print("\n\nTesting caching (should be faster on second call):")
import time

start_time = time.time()
events3 = generate_mock_events_for_date(today)
first_call_time = time.time() - start_time
print(f"First call took: {first_call_time:.6f} seconds")

start_time = time.time()
events4 = generate_mock_events_for_date(today)
second_call_time = time.time() - start_time
print(f"Second call took: {second_call_time:.6f} seconds")
print(f"Cache improved speed by: {first_call_time / second_call_time:.2f}x")

# Verify events are identical on subsequent calls
identical = True
for i, (e1, e2) in enumerate(zip(events, events4)):
    if e1.id != e2.id or e1.time != e2.time or e1.name != e2.name:
        identical = False
        print(f"  Mismatch at event {i + 1}: {e1.id} vs {e2.id}")

if identical:
    print("Cached events are identical to original ✓")
else:
    print("ERROR: Cached events differ from original calls!")
