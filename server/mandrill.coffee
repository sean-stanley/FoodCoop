moment = require 'moment'
_ = require 'lodash'
config = require './config'
.Config
coopConfig = require './coopConfig'
mandrill = require 'mandrill-api/mandrill'
mandrill_client = new mandrill.Mandrill config.mandrillCredentials.pass

console.log process.env.NODE_ENVIRONMENT

template_name = 'delivery-day-template'
template_content = []
message =
  # 'html': '<p>Example HTML content</p>'
  # 'text': 'Example text content'
  # 'subject': 'example subject'
  # 'from_email': 'message.from_email@example.com'
  # 'from_name': 'Example Name'
  'to': [ {
    'email': 'sean@maplekiwi.com'
    'name': 'Sean Stanley'
    'type': 'to'
  } ]
  'headers': 'Reply-To': 'message.reply@example.com'
  'important': false
  'track_opens': true
  'track_clicks': true
  'auto_text': true
  'auto_html': null
  'inline_css': null
  'url_strip_qs': null
  'preserve_recipients': null
  'view_content_link': null
  'bcc_address': null
  'tracking_domain': null
  'signing_domain': null
  'return_path_domain': null
  'merge': true
  'merge_language': 'mailchimp'
  'global_merge_vars': [ {
    'name': 'COMPANY'
    'content': 'Northland Natural Food Co-op Ltd.'
  } ]
  'merge_vars': [ {
    'rcpt': 'sean@maplekiwi.com'
    'vars': [ {
      'FNAME': 'Sean'
    } ]
  } ]
  'tags': [ 'test-from-node' ]
  'subaccount': null
  'google_analytics_domains': [ 'foodcoop.nz' ]
  'google_analytics_campaign': 'message.sean@foodcoop.nz'
  'metadata': 'website': 'foodcoop.nz'
  'recipient_metadata': [ {
    'rcpt': 'sean@maplekiwi.com'
    'values': 'user_id': 123456
  } ]
  # 'attachments': [ {
  #   'type': 'text/plain'
  #   'name': 'myfile.txt'
  #   'content': 'ZXhhbXBsZSBmaWxl'
  # } ]
  # 'images': [ {
  #   'type': 'image/png'
  #   'name': 'IMAGECID'
  #   'content': 'ZXhhbXBsZSBmaWxl'
  # } ]
async = false
ip_pool = 'Main Pool'
#send_at = 'example send_at'

getEmails = (user) -> {email: user.email, name: user.name, type: 'to'}

sendTemplate = (templateName, recipients, options, callback) ->
  if !_.isArray recipients
    recipients = [recipients]

  if arguments.length == 3
    if typeof arguments[2] == 'function'
      callback = options
    if typeof arguments[2] == 'object'
      callback = _.noop

  unless options?
    options = {}



  message =
    'important': options.important or false
    'headers': 'Reply-To': coopConfig.adminEmail.email
    'track_opens': true
    'track_clicks': true
    'auto_text': true
    # 'auto_html': null
    # 'inline_css': null # make sure template has already had css inlined
    # 'url_strip_qs': null
    # 'preserve_recipients': null
    # 'view_content_link': null
    # 'bcc_address': null
    # 'tracking_domain': null
    # 'signing_domain': null
    # 'return_path_domain': null
    'merge': true
    'merge_language': options.mergeLanguage or 'mailchimp'
    'global_merge_vars': [ {
      'name': 'COMPANY'
      'content': 'Northland Natural Food Co-op Ltd.'
    } ]
    # 'merge_vars': [ {
    #   'rcpt': 'sean@maplekiwi.com'
    #   'vars': [ {
    #     'FNAME': 'Sean'
    #   } ]
    # } ]
    'tags': options.tags or []
    'google_analytics_domains': [ 'foodcoop.nz' ]
    'google_analytics_campaign': 'message.sean@foodcoop.nz'
    'metadata': 'website': 'foodcoop.nz'

  getMergeVars = (user) ->
    data = {
      rcpt: user.email
      vars: [
        {'FNAME': user.name.split(" ").slice(0,-1).join(" ")}
      ]
    }
    # this might need some work depending on implementation of options.data at least above is working well.
    if options.data?
      _.extend data.vars[0], options.data

    data

  message.to = _.map recipients, getEmails

  message.merge_vars = _.map recipients, getMergeVars


  mandrill_client.messages.sendTemplate {
    'template_name': templateName
    'template_content': options.templateContent or []
    'message': message
    'async': async
    'ip_pool': ip_pool
  #  'send_at': send_at
  }, (result) ->
    callback(null, result)

  , (e) ->
      callback(e)


sendMessage = (messageHtml, recipients, subject, options, callback) ->
  unless _.isArray recipients
    recipients = [recipients]

  if arguments.length == 4
    if typeof arguments[3] == 'function'
      callback = options
    if typeof arguments[3] == 'object'
      callback = _.noop

  unless options?
    options = {}

  message =
    'important': options.important or false
    'headers': 'Reply-To': coopConfig.adminEmail.email
    'track_opens': true
    'track_clicks': true
    'auto_text': true
    'html': messageHtml
    "from_email": 'sean@foodcoop.nz'#coopConfig.adminEmail.email,
    "from_name": 'Northland Natural Food Co-op'#coopConfig.adminEmail.name,
    "subject": subject,
    'merge': true
    'merge_language': options.mergeLanguage or 'mailchimp'
    'global_merge_vars': [ {
      'name': 'COMPANY'
      'content': 'Northland Natural Food Co-op Ltd.'
    } ]
  # 'merge_vars': [ {
  #   'rcpt': 'sean@maplekiwi.com'
  #   'vars': [ {
  #     'FNAME': 'Sean'
  #   } ]
  # } ]
    'tags': options.tags or []
    'google_analytics_domains': [ 'foodcoop.nz' ]
    'google_analytics_campaign': 'message.sean@foodcoop.nz'
    'metadata': 'website': 'foodcoop.nz'

  message.to = _.map recipients, getEmails

  mandrill_client.messages.send {
    'message': message
  }, (result) ->
    callback(null, result)

  , (e) ->
      callback(e)



exports.send = sendTemplate
exports.sendMessage = sendMessage
