// Server side of Talent Foxes: push notifications and clean-up of children's sign-in accounts.
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";
import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as h from "./handlers.js";

initializeApp();
const deps = { db: getFirestore(), messaging: getMessaging(), auth: getAuth() };

// Functions run in a regular region close to the database (Firestore multi-region eur3 is Europe).
const region = "europe-west1";
const LOG = "families/{fid}/kids/{kidId}/log/{id}", ORDER = "families/{fid}/kids/{kidId}/orders/{id}", KID = "families/{fid}/kids/{kidId}";

export const logCreated = onDocumentCreated({ document: LOG, region }, e => h.onLogCreated(deps, { fid: e.params.fid, kidId: e.params.kidId, data: e.data && e.data.data() }));
export const logUpdated = onDocumentUpdated({ document: LOG, region }, e => h.onLogUpdated(deps, { fid: e.params.fid, kidId: e.params.kidId, before: e.data && e.data.before.data(), after: e.data && e.data.after.data() }));
export const orderCreated = onDocumentCreated({ document: ORDER, region }, e => h.onOrderCreated(deps, { fid: e.params.fid, kidId: e.params.kidId, data: e.data && e.data.data() }));
export const kidUpdated = onDocumentUpdated({ document: KID, region }, e => h.onKidUpdated(deps, { fid: e.params.fid, kidId: e.params.kidId, before: e.data && e.data.before.data(), after: e.data && e.data.after.data() }));
export const kidDeleted = onDocumentDeleted({ document: KID, region }, e => h.onKidDeleted(deps, { fid: e.params.fid, kidId: e.params.kidId, data: e.data && e.data.data() }));
