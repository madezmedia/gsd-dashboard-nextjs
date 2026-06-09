# Signature Offer: AZ Pet Stylist Agent Fleet

This document outlines the core offer, pricing packaging, deliverables, unit economics (cost), and fulfillment workflow for the **AZ Pet Stylist** autonomous agent fleet, built on the ACMI operating system.

---

## 👥 1. Target Avatar & Core Problem

* **Avatar:** Mobile pet grooming salon owners (Gilbert, Chandler, & Queen Creek, AZ) managing high daily call volumes while actively grooming pets.
* **Core Problem:** salon owners miss 40%+ of inbound calls during groom sessions (groomers are busy or cannot answer with wet/soapy hands). This results in lost leads to competitors, manual callbacks at night, and calendar gaps.
* **The Promise:** Capture every lead 24/7, automate MoeGo calendar bookings, and optimize mobile grooming routes on autopilot.

---

## ⚙️ 2. Core Offer & Deliverables

We build and host the **ACMI Mobile Grooming Agent Fleet** consisting of 5 coordinated AI agents working as a single business intelligence unit.

### Included Deliverables:
1. **🎧 24/7 Front Desk Voice Agent (VAPI):**
   * Answers phone calls within 2 rings in a warm, professional, human-like voice (VAPI Layla).
   * Explains dog/cat grooming pricing, service packages, and fear-free policies.
   * Directly queries booking slots via the MoeGo custom API (`checkMoeGoAvailability`).
2. **📅 Route-Optimized Scheduler Agent:**
   * Automatically groups appointments geographically (Gilbert, Chandler, Queen Creek) to minimize drive time and fuel costs.
   * Matches dog size and breed requirements with groomer truck capabilities.
3. **✂️ Groomer Assistant Prep Agent:**
   * Synthesizes historical pet profiles (breed size, allergies, temper, past groomer notes, and fear-free requirements) before each appointment.
   * Transmits daily prep briefs to groomers.
4. **📣 Automated Marketing & Rebooking Agent:**
   * Triggers personalized SMS reminders 4, 6, and 8 weeks post-groom to prompt rebooking.
   * Integrates booking links that automatically load the customer's prior preferences.
5. **📊 Owner Ops Center (GSD Dashboard):**
   * Real-time metrics dashboard mapping gross revenue, route efficiency, daily calls, and customer retention.

---

## 💰 3. Pricing Packaging

We offer two pricing packages tailored for scaling mobile salons:

### 📦 Plan A: Managed Grooming Fleet (Recommended)
* **Setup Fee:** $2,500 (one-time setup & custom prompts)
* **Monthly Fee:** $497/month
* **Included Limits:** First 1,500 minutes of VAPI call time included. Additional minutes at $0.15/minute.
* **Support:** Email support (24-hour response).

### 🏢 Plan B: Full Enterprise Fleet
* **Setup Fee:** $4,500 (custom MoeGo API schema integrations + CRM routing)
* **Monthly Fee:** $1,997/month
* **Included Limits:** Unlimited call minutes (fair-use capped at 10,000 minutes/month).
* **Support:** Dedicated Slack channel, weekly prompt tuning, and active route optimization monitoring.

---

## 📊 4. Unit Economics (Cost of Fulfillment)

Mad EZ Media maintains a **~75% gross profit margin** on Plan A:

| Cost Component | Monthly Cost (Plan A Base) | Explanation |
| :--- | :--- | :--- |
| **VAPI Call Time** | ~$105.00 | Average client uses ~700 mins/mo at $0.15/min (GPT-4o-mini). |
| **ACMI Redis Database** | ~$1.00 | Upstash Redis storage per tenant. |
| **API Webhook Hosting** | ~$0.00 | Hosted on Vercel's free serverless tier. |
| **Twilio Phone Line** | $2.00 | Monthly phone line lease. |
| **Total Cost** | **~$108.00 / month** | Out-of-pocket fulfillment cost. |
| **Gross Margin** | **~$389.00 / month (~78%)** | Recurring margin retained by Mad EZ Media. |

---

## 🛠️ 5. Fulfillment & Deployment Pipeline

Once a client signs up, the deployment takes **7 business days**:
1. **Day 1-2 (Ingestion):** Map client's pricing list, service rules, and custom Moego booking structures.
2. **Day 3-4 (Agent Building):** Deploy the VAPI voice configuration, wire Twilio numbers, and test the `checkMoeGoAvailability` custom webhook.
3. **Day 5 (Integration):** Link the client's fleet to the central GSD Dashboard and connect the Upstash ACMI logging pipeline.
4. **Day 6 (Smoke Testing):** Execute test calls to verify booking logic, route optimization clustering, and profile syncs.
5. **Day 7 (Launch):** Go-live and deliver the interactive proposal landing page to the client.
