export default {
  channels: {
    api: 'admin/group_alerts/'
  },
  alertlist: {
    api: 'admin/card_sa/'
  },
  alertfiltersnew: {
    api: 'admin/search_list/v2/'
  },
  alertfilters: {
    api: 'admin/search_list/'
  },
  alertcategories: {
    api: 'admin/card_category_list/'
  },
  alertdetails: {
    api: 'admin/card_sa/'
  },
  editalert: {
    api: 'admin/update_alert/'
  },
  alertexport: {
    api: 'admin/export/sa/'
  },
  alertformcategories: {
    api: 'admin/card_category/'
  },
  alertformcampaign: {
    api: 'admin/campaign/'
  },
  alertformanalysisfields: {
    api: 'admin/analysis_settings/'
  },
  alertreferencename: {
    api: 'admin/get_tld_source_url/'
  },
  alertfileupload: {
    api: 'admin/upload_document/'
  },
  alertdoclibupload: {
    api: 'admin/drive_view/'
  },
  alertdoclibrarylist: {
    api: 'admin/drive_view/'
  },
  mclstmtalert: {
    api: 'admin/mcl/mcl-statement-alert/'
  },
  alertformhandlinginstructions: {
    api: 'admin/special_handling/'
  },
  alertformusergroups: {
    api: 'admin/user_group/'
  },
  alertformusergroupset: {
    api: 'admin/user_group_set/'
  },
  alertformrecipientusers: {
    api: 'admin/tenant_user_list/'
  },
  alertsharingcommunity: {
    api: 'admin/share-with-community-configuration/'
  },
  alertformparseindicators: {
    api: 'admin/parse_indicator/'
  },
  alertformextractindicators: {
    api: 'admin/extract_attachment_ioc/'
  },
  alertformtagsgroup: {
    api: 'admin/tag/tag_group/'
  },
  alertformtags: {
    api: 'admin/card_tags/'
  },
  alertaddtags: {
    api: 'admin/sa_add_tag/'
  },
  alertsubmitform: {
    api: 'admin/card_sa/?errorHandle=false'
  },
  linkedAlertsList: {
    api: 'admin/search_card_sa/'
  },
  slas: {
    api: 'admin/alert_acknowledgement/slas/'
  },
  threatAssessmentTemplates: {
    api: 'admin/alert_acknowledgement/'
  },
  alertConferenceDial: {
    api: 'admin/conference_dial/'
  },
  alertRecipientCount: {
    api: 'admin/user_count_sa/'
  },
  relatedAlerts: {
    api: 'admin/indicator/related_alerts/'
  },
  relatedAlertsCount: {
    api: 'admin/indicator/related_alert_count/'
  },
  alertTemplate: {
    api: 'admin/alert_template/'
  },
  tdList: {
    api: 'admin/tdl/v1/content/published/'
  },
  alertParseUrls: {
    api: 'admin/get_references/'
  },
  locations: {
    api: '/admin/card_location_view/'
  },
  alertLock: {
    api: '/admin/lock_sa/'
  },
  intelList: {
    api: '/admin/intel_report/'
  },
  rfiList: {
    api: '/admin/rfi/'
  },
  createAlertFromIntel: {
    api: 'admin/create_intel_sa/'
  },
  threatAssessmentResponse: {
    api: '/admin/alert_acknowledgement/approve/'
  },
  attackMatrix: {
    api: 'admin/attack_framework/attack-matrix/'
  },
  attackTactic: {
    api: 'admin/attack_framework/attack-tactic/'
  },
  alertRating: {
    api: '/admin/card_sa_feedback/rating/'
  },
  alertFeedback: {
    api: 'admin/card_sa_feedback/'
  },
  exportFeedback: {
    api: 'admin/card_sa_feedback/export/'
  },
  timezoneList: {
    api: 'admin/static_data/timezone_list/'
  },
  createFolder: {
    api: 'admin/folder_view/'
  },
  tdlFilesAlert: {
    api: 'admin/tdl/v1/content/related/'
  },
  alertSharingCommuntiy: {
    api: '/admin/share_alert_with_communities/'
  },
  alertCommunities: {
    api: '/admin/share-with-community-configuration/?'
  },
  publishToCommunities: {
    api: '/admin/share_alert_with_communities/'
  },
  tlpEmailConfiguration: {
    api: 'admin/tlp_email_config/tlp_email_configuration/'
  },
  speedbumpAuthRules: {
    api: 'admin/rules/'
  },
  speedbumpAuthList: {
    api: 'admin/rules/speed_bump/'
  },
  speedBumpCondition: {
    api: 'admin/rules/speed_bump_condition_check/'
  },
  updateSpeedbumpRule: {
    api: 'admin/rules/update_flag/'
  },
  sendOtpSpeedbump: {
    api: 'admin/rules/send_otp/'
  },
  getAuthType: {
    api: 'rest-auth/login_mode/?cy_token=4e99c208-58d5-4050-a0a6-02d0b085ad4c'
  },
  checkSharingRules: {
    api: 'admin/community_circle/check_sharing_rules/'
  },
  closedRfiResponse: {
    api: 'admin/rfi/rfi_alert/'
  },
  deleteRfiResponse: {
    api: 'admin/rfi/alert'
  },
  alertComments: {
    api: 'admin/alert-comments/'
  },
  partialAlertUpdate: {
    api: 'admin/partial-alert-update/'
  },
  fetchFolderRg: {
    api: '/admin/drive_rg/'
  },
  addAttachments: {
    api: 'admin/sa_update_attachments/'
  },
  threatResponseApproval: {
    api: '/admin/alert_acknowledgement/approve/'
  },
  alertsBulkAction: {
    api: '/admin/alert-utilities/bulk-action/'
  },
  alertformorgrg: {
    api: 'admin/org-based-rg/'
  },
  alertTeamsListing: {
    api: 'admin/v1/analyst-groups/categories/'
  },
  permittedPublishers: {
    api: 'admin/v1/analyst-groups/permitted-publishers/'
  },
  downloadDocument: {
    api: 'admin/document_download/'
  }
};
