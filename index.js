import makeWASocket from "@whiskeysockets/baileys"
import settings from "./settings.js"
import { commandHandler } from "./commandHandler.js"
import pino from "pino"
import { Boom } from "@hapi/boom"

async function startBot() {
  // Initialize socket
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false, // no QR
    browser: [settings.BOT_NAME, "Chrome", "1.0"]
  })

  // Connection updates
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      if (statusCode !== 401) { // 401 = logged out
        console.log("⚡ Reconnecting Nivel MD...")
        startBot()
      } else {
        console.log("❌ Logged out. Please relink your device.")
      }
    } else if (connection === "open") {
      console.log("✅ NIVEL MD CONNECTED SUCCESSFULLY")
    }
  })

  // Messages handler
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    await commandHandler(sock, msg)
  })

  // Listen for credentials updates
  sock.ev.on("creds.update", () => {
    console.log("💾 Credentials updated")
  })

  // Multi-device linking code (optional)
  console.log("\n📌 If you want to link this bot to your WhatsApp number via linking code:")
  console.log("1. Open WhatsApp → Settings → Linked Devices → Link a Device")
  console.log("2. Copy the code and paste here if needed (future updates can use session file automatically)\n")
}

startBot()