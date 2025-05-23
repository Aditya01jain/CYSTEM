const express = require("express")
const router = express.Router()

const {
  get_bundle,
  get_mitre_defender,
  get_tdl_files
  } = require("../controllers/alert")

  router.post("/bundle", get_bundle)
  router.post("/bundle", get_mitre_defender)
  router.post("/tdl", get_tdl_files)
  module.exports = router