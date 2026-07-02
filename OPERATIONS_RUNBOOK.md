# Operations runbook

## First owner account

1. The owner creates a normal account and verifies the email.
2. In Firebase Console open **Project settings > Service accounts**, generate a new private key, and save the JSON outside this repository (for example `C:\secure\coop-commerce-admin.json`).
3. On a trusted machine run:

   `npm run bootstrap:super-admin -- babatundeoralusi@gmail.com --service-account "C:\secure\coop-commerce-admin.json"`

4. The script only accepts the owner configured in `operations.config.json`. After success, securely delete/archive the downloaded key. The owner signs out and back in, then opens `/admin/operations`.

Nobody can select an operational role during public registration. Operational access requires the role in both the Firebase ID-token custom claims and the server-owned Firestore profile.

## Hiring staff

Staff first create and verify ordinary accounts using their company-controlled email addresses. The owner opens `/admin/operations`, enters the email, and assigns exactly the job needed. The API records who assigned the role and revokes existing sessions so the staff member must sign in again.

- `support_agent`: communicates on cases and gathers evidence.
- `dispute_officer`: makes dispute decisions.
- `finance_operator`: approves and records payouts/refunds.
- `risk_officer`: investigates exception flags and high-risk cases.
- `admin`: oversees operations queues.
- `super_admin`: assigns operational roles and controls critical configuration.

## Daily operation

Opening a dispute creates a case, flags the order, and moves the disputed amount into the seller's held balance. The staff workspace refreshes every 15 seconds. Payout requests reserve available balance immediately. Requests with open disputes, changed bank details, or amounts at/above `LARGE_PAYOUT_NGN` require two distinct approvals.

`mark_paid` must only be used after the bank/payment provider accepts the transfer, and requires its external reference. Provider transfer initiation and webhook reconciliation should be connected before enabling unattended payouts; the current workflow intentionally does not pretend that a database status moved real money.
