# eRank Test Cases

**End-to-End Test Cases**  
**Date:** 1 September 2026  
**Created by:** PMP Solutions Team  
**Conducted by:** Indian Centre Rank Staff and PMP Solutions Team

---

## Test Execution Matrix

| Test Case ID | Test Case | Expected Result | Result | Comments |
| :--- | :--- | :--- | :--- | :--- |
| **TC-E001** | Admin creates owner -> owner adds taxi -> driver is assigned | All records are correctly linked |  |  |
| **TC-E002** | Driver scans rank QR -> joins queue -> presses DEPART | Taxi leaves queue, operation is created, and revenue is recorded |  |  |
| **TC-E003** | Marshal searches taxi -> adds it to queue -> presses DEPART | Correct taxi is queued, departed, and recorded |  |  |
| **TC-E004** | Taxi departs -> revenue is calculated -> owner views revenue | Owner sees the correct updated revenue |  |  |
| **TC-E005** | Marshal posts rank update -> passenger opens public page | Passenger can see the published update |  |  |
| **TC-E006** | Passenger searches taxi -> views driver/route -> shares details | Correct taxi information is available for sharing |  |  |
| **TC-E007** | Driver sends SOS -> owner receives email | Correct emergency information reaches the correct owner |  |  |
| **TC-E008** | Long-distance taxi -> passenger captured -> taxi departs -> SOS sent | Passenger, next-of-kin, and operation information remain correctly linked |  |  |
