const Alert = require("../models/alert");
const {process_data} = require("../utils/process")
require("dotenv").config();

exports.process_alert = async (req, res) => {
    try {
        console.log('hellpppp')
        const alert = req.body;
        data = process_data(alert)
        return res.status(200).json({
            success: true,
            data : data
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
			success: false,
			message: "Alert can't be processed, Please try again.",
		});
    }
}
