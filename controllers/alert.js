const Alert = require("../models/alert");
require("dotenv").config();

exports.process_alert = async (req, res) => {
    try {
        console.log('hellpppp')
        const alert = req.body;
        console.log(alert)
        return res.status(200).json({
            success: true,
            message: "recived"
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
			success: false,
			message: "Alert can't be processed, Please try again.",
		});
    }
}