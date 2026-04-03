import socket

def intercept_telemetry():
    # Create a raw UDP network socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    # Listen on the exact port MAVLink uses (14540)
    sock.bind(('0.0.0.0', 14540))
    print("📡 WIRETAP ACTIVE: Listening for drone heartbeats on port 14540...")

    while True:
        # Wait to intercept a data packet
        data, addr = sock.recvfrom(1024)
        print(f"🟢 INTERCEPTED! Received {len(data)} bytes of raw telemetry from {addr}")

if __name__ == "__main__":
    intercept_telemetry()