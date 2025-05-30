const express = require("express")
const router = express.Router()

const {
  get_bundle,
  get_mitre_defender,
  get_tdl_files,
  alert_summary,
  get_co_playbook
  } = require("../controllers/alert")

  router.post("/bundle", get_bundle)
  router.post("/ttp", get_mitre_defender)
  router.post("/tdl", get_tdl_files)
  router.post("/summary", alert_summary)
  router.post("/questions", get_co_playbook)
  module.exports = router