const express = require("express")
const router = express.Router()

const {
    process_alert
  } = require("../controllers/alert")

  router.post("/process", process_alert)
  module.exports = router