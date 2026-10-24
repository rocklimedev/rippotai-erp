# NAS Remote Access via WireGuard (Raspberry Pi Gateway)

This runbook connects the production API on the VPS to the office NAS, so the
app can read and write NAS files from anywhere. It covers the VPS, the
Raspberry Pi gateway, the NAS, and the backend configuration.

## 1. Architecture

```
Users (anywhere)
   |
   v
Production API  (VPS 66.116.204.81, WireGuard 10.8.0.1)
   |  encrypted WireGuard tunnel (UDP 51820)
   v
Raspberry Pi gateway  (office LAN, WireGuard 10.8.0.2)
   |  LAN, SFTP port 22
   v
NAS  (192.168.1.3, share /volume1/inos-erp)
```

- The VPS cannot reach `192.168.1.3` directly because it is a private office address.
- The Raspberry Pi sits on the office LAN, connects out to the VPS, and forwards traffic to the NAS.
- Users never talk to the NAS. Only the API does.

| Item            | Value                        |
|-----------------|------------------------------|
| VPS public IP   | 66.116.204.81                |
| VPS WG address  | 10.8.0.1/24                  |
| Pi WG address   | 10.8.0.2/24                  |
| WG port         | UDP 51820                    |
| NAS LAN IP      | 192.168.1.3                  |
| Office subnet   | 192.168.1.0/24 (verify mask) |
| SFTP user       | inos-sftp                    |
| NAS path        | /volume1/inos-erp            |

Replace placeholders in angle brackets with your real values. Never commit
keys, passwords, or `.env` files to git.

## 2. Prerequisites

- Raspberry Pi (3B+ or newer, 4 or 5 recommended) with Raspberry Pi OS 64-bit
  (Bookworm) or Ubuntu Server, installed and updated.
- Ethernet cable to the office router or switch (preferred over Wi-Fi).
- Power supply, and ideally a UPS.
- The Pi is on the same LAN as the NAS. Check with `ping 192.168.1.3`.
- SFTP is working from a PC on the LAN (already done).
- Root or sudo access to the VPS.

## 3. Reserve a fixed IP for the Pi

In your router's admin page, create a DHCP reservation for the Pi's MAC
address (for example `192.168.1.20`). This prevents the masquerade rule from
breaking when the Pi gets a new address.

Find the Pi's interface and MAC:

```bash
ip -br a
```

Note the interface name, usually `eth0` (cable) or `wlan0` (Wi-Fi). Use that
name in the config below wherever `eth0` appears.

## 4. Set up the Raspberry Pi

### 4.1 Install WireGuard

```bash
sudo apt update
sudo apt install -y wireguard-tools iptables
```

### 4.2 Generate the Pi's keys

```bash
sudo -i
cd /etc/wireguard
umask 077
wg genkey | tee privatekey | wg pubkey > publickey
chmod 600 privatekey publickey
cat publickey
```

Save the public key. Keep `privatekey` on the Pi only.

### 4.3 Create `/etc/wireguard/wg0.conf` on the Pi

Replace `<PI_PRIVATE_KEY>` with the content of `/etc/wireguard/privatekey`,
and `eth0` with your LAN interface name:

```ini
[Interface]
Address = 10.8.0.2/24
PrivateKey = <PI_PRIVATE_KEY>
PostUp   = sysctl -w net.ipv4.ip_forward=1; iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -m state --state RELATED,ESTABLISHED -j ACCEPT; iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -m state --state RELATED,ESTABLISHED -j ACCEPT; iptables -t nat -D POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE

[Peer]
PublicKey = cA/FBOevNygzVMI2Inz2ZHAHbJVrbs48MbvwT5glxRM=
Endpoint = 66.116.204.81:51820
AllowedIPs = 10.8.0.0/24, 192.168.1.0/24
PersistentKeepalive = 25
```

Lock it down:

```bash
sudo chmod 600 /etc/wireguard/wg0.conf
```

Why the masquerade rule matters: the NAS's default gateway is the office
router, not the Pi. Without NAT, the NAS would send replies to `10.8.0.x`
addresses that it cannot route back, and the traffic would be lost.

### 4.4 Start the tunnel on boot

```bash
sudo systemctl enable --now wg-quick@wg0
sudo wg show
```

The output should show `interface: wg0` and a peer line. A `latest handshake`
line appears after the VPS is configured (section 5).

## 5. Configure the VPS

The VPS already has `wg0` running with public key
`cA/FBOevNygzVMI2Inz2ZHAHbJVrbs48MbvwT5glxRM=`. Add the Pi as a peer:

```bash
cat >> /etc/wireguard/wg0.conf <<'PEER'

[Peer]
PublicKey = <PI_PUBLIC_KEY>
AllowedIPs = 10.8.0.2/32, 192.168.1.0/24
PEER

systemctl restart wg-quick@wg0
wg show
```

Replace `<PI_PUBLIC_KEY>` with the output of `cat publickey` on the Pi.

If the VPS has a firewall at the provider level, UDP 51820 must be open there
too. ufw already allows it (`ufw allow 51820/udp`).

## 6. Verify the tunnel, in order

On the **Pi**:

```bash
sudo wg show                  # latest handshake should be recent
ping -c3 10.8.0.1             # reach the VPS
ping -c3 192.168.1.3          # reach the NAS
```

On the **VPS**:

```bash
wg show                       # peer with recent handshake
ping -c3 10.8.0.2             # reach the Pi
nc -vz 192.168.1.3 22         # SSH/SFTP port open on the NAS
sftp -P 22 inos-sftp@192.168.1.3
# inside sftp:  pwd   then   ls /volume1/inos-erp
```

If all checks pass, the NAS is reachable from production.

## 7. Get the NAS host key fingerprint (run on the VPS)

```bash
ssh-keyscan -t ed25519 192.168.1.3 2>/dev/null | awk '{print $3}' | base64 -d | sha256sum
```

The 64-character hex result is `NAS_HOST_KEY_SHA256`. Confirm it matches the
fingerprint shown in DSM before trusting it.

## 8. Configure the production backend (VPS)

Edit the production `.env` on the VPS (not in git):

```
NAS_ENABLED=true
NAS_HOST=192.168.1.3
NAS_PORT=22
NAS_USERNAME=inos-sftp
NAS_PASSWORD=<sftp password>
NAS_UPLOAD_PATH=/volume1/inos-erp
NAS_HOST_KEY_SHA256=<64 hex chars from section 7>
NAS_MIN_FILE_SIZE_MB=50
CDN_PRIVATE_PROXY_ENABLED=true
CDN_BASE_URL=https://<your-cdn-domain>/cdn
```

Restart the backend (pm2 or Docker, whichever runs production):

```bash
pm2 restart all          # or: docker compose up -d
```

Verify through the API with an account that has `settings:read`:

```
GET /nas/status   ->  { "connected": true, "status": "connected", ... }
```

Troubleshooting values:

| status            | meaning                                             |
|-------------------|-----------------------------------------------------|
| `disabled`        | `NAS_ENABLED` is not `true`; restart after changing |
| `not_configured`  | missing variable or bad fingerprint format          |
| `unavailable`     | tunnel, SFTP login, or folder permission problem    |

Then upload a file over 50 MB through the app and confirm it downloads back.

## 9. Keep it running

- Enable boot start on both ends: `systemctl enable wg-quick@wg0`.
- Use a UPS on the Pi and the router if possible. A power cut is the most
  likely cause of downtime.
- Monitor the tunnel: on the VPS, `wg show` should show a handshake within the
  last few minutes. A simple cron check can alert you if it stops.
- Keep the Pi updated: `sudo apt update && sudo apt full-upgrade` monthly.

## 10. Security checklist

- [ ] Keys are generated on each machine and private keys never leave it.
- [ ] `wg0.conf` files are `chmod 600`.
- [ ] UDP 51820 is the only new port opened on the VPS.
- [ ] The NAS SFTP account `inos-sftp` can access only `/volume1/inos-erp`.
- [ ] DSM web port 5000 is not exposed to the internet.
- [ ] The Pi has no other services exposed; disable unused ones.
- [ ] `.env` is not in git.
- [ ] Rotate the SFTP password and WireGuard keys if they were ever shared.

## 11. Local development

Your local machine is on the office LAN and can keep using
`NAS_HOST=192.168.1.3` directly, with no tunnel. Consider a separate upload
folder for local testing, for example `/volume1/inos-erp-dev`, so test files
do not mix with production files.

## 12. Troubleshooting

| Symptom                                   | Check                                                                 |
|-------------------------------------------|-----------------------------------------------------------------------|
| No handshake in `wg show`                 | Public keys match on both sides; endpoint `66.116.204.81:51820`; UDP 51820 open |
| Pi reaches VPS but not NAS                | Pi's `ping 192.168.1.3`; NAS firewall allows the Pi's LAN address; masquerade rule present (`sudo iptables -t nat -L -n -v`) |
| VPS reaches Pi but not NAS                | Pi's IP forwarding (`sysctl net.ipv4.ip_forward` = 1); FORWARD rules  |
| SFTP asks for password and fails          | Account enabled, password correct, SSH service on, folder permissions |
| `/nas/status` says `not_configured`       | Missing `.env` variable; fingerprint must be 64 hex characters        |
| Tunnel stops after a reboot               | `systemctl is-enabled wg-quick@wg0` on both machines                  |
| Works locally, fails in production        | Production `.env` on the VPS is missing NAS values or the backend was not restarted |

Useful commands:

```bash
wg show                          # tunnel status
sudo iptables -t nat -L -n -v    # NAT counters on the Pi
journalctl -u wg-quick@wg0 -n 50 # WireGuard logs
```

## 13. Deployment checklist

1. Pi set up, keys generated, `wg0` running and enabled on boot.
2. VPS peer added, `wg show` shows a handshake.
3. Pi reaches `192.168.1.3`; VPS reaches `192.168.1.3:22`.
4. SFTP login from VPS works.
5. Host key fingerprint recorded.
6. Production `.env` updated and backend restarted.
7. `/nas/status` returns `connected`.
8. Test upload (over 50 MB) and download succeed.
9. UPS and DHCP reservation in place.
