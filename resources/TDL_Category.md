# Threat Content Categories and File Extensions

This document outlines various content categories used in threat detection and response systems, along with their associated file extensions. This can help in organizing, identifying, and processing different types of threat intelligence and detection content.

---

## 1. Analytics - CAR
**Extensions**: `.yaml`, `.yml`  
CAR (Cyber Analytics Repository) analytics are typically written in YAML format.

---

## 2. Response Playbooks
**Extensions**: `.json`  
Playbooks used for automated response workflows are commonly stored in JSON format.

---

## 3. SIEM Rules - Sigma
**Extensions**: `.yaml`, `.yml`  
Sigma rules are generic SIEM detection rules written in YAML.

---

## 4. Threat Detection - Snort/Suricata
**Extensions**: `.rules`  
Snort and Suricata use `.rules` files to define packet-based detection signatures.

---

## 5. SIEM Rules - Splunk
**Extensions**: `.spl`  
Splunk detection rules and saved searches are often stored in `.spl` files.

---

> 📌 **Note**: Ensure that file extensions are consistently applied during ingestion, processing, or development pipelines to avoid misclassification.