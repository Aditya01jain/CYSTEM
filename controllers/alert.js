const Alert = require("../models/alert");
const {get_bundle, tld_file_extracter, defender_extract, summarize} = require("../utils/process")
require("dotenv").config();

exports.get_bundle = async (req, res) => {
    try {
        const alert = req.body;
        data = await get_bundle(alert)
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

exports.get_mitre_defender = async (req, res) => {
    try {
        const alert = req.body;
        data = await defender_extract(alert)
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

exports.get_tdl_files = async (req, res) => {
    try {
        const alert = req.body;
        data = await tld_file_extracter(alert)
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

exports.alert_summary = async (req, res) => {
    try {
        const alert = req.body;
        data = await summarize(alert)
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

// exports.get_co_playbook = async (req, res) => {
//     try {
//         const alert = req.body;
//         data = await generate_playbooks(alert)
//         return res.status(200).json({
//             success: true,
//             data : data
//         })
//     } catch (error) {
//         console.error(error)
//         return res.status(500).json({
// 			success: false,
// 			message: "Alert can't be processed, Please try again.",
// 		});
//     }
// }
