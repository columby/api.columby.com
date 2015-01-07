'use strict';

var mandrill = require('mandrill-api/mandrill'),
    config = require('../config/environment');

var mandrill_client = new mandrill.Mandrill(config.mandrill.key);


exports.preRegister = function(vars, callback){

  mandrill_client.messages.sendTemplate({
    'template_name': 'columby-notice-template',
    'template_content' : [{
      'name' : 'Your registration at Columby!',
      'content' : 'Hi!<br/>Thanks for registering. We\'ll let you know when your account is approved!<br><br>If you don\'t know what this is about, then someone has probably entered your email address by mistake. Sorry about that.'
    }],
    'message': {
      //'html': vars.tokenurl,
      //'text': vars.tokenurl,
      'subject': 'Registration at Columby',
      'from_email': 'noreply@columby.com',
      'from_name': 'Columby',
      'to': [{
        'email': vars.user.email,
        'name': vars.user.name,
        'type': 'to'
      }],
      'headers': {
        'Reply-To': 'noreply@columby.com'
      },
      'merge_vars': [{
        'rcpt' : vars.user.email,
        'vars': [{
          'name':'TITLE',
          'content':'Welcome to Columby!',
        },{
          'name':'MESSAGE',
          'content':'Hi!<br/>You can log in right away and start using your new account. Please click the button below to login. <br>Or copy and paste this url:<br>' + vars.tokenurl + '<br><br>If you don\'t know what this is about, then someone has probably entered your email address by mistake. Sorry about that.<br><br>Thank you,<br>The Columby team'
        },{
          'name':'LINK',
          'content': vars.tokenurl
        },{
          'name':'LINKTITLE',
          'content': 'Login at Columby'
        }],
      }],
    }
  }, callback);
}


// send a login email to a user
exports.register = function(vars, callback){

  mandrill_client.messages.sendTemplate({
    'template_name': 'columby-notice-template',
    'template_content' : [{
      'name' : 'Welcome to Columby!',
      'content' : 'Hi!<br/>You can log in right away and start using your new account. Please click the button below to login. <br>Or copy and paste this url:<br>' + vars.tokenurl + '<br><br>If you don\'t know what this is about, then someone has probably entered your email address by mistake. Sorry about that.'
    }],
    'message': {
      'html': vars.tokenurl,
      'text': vars.tokenurl,
      'subject': 'Login at Columby',
      'from_email': 'noreply@columby.com',
      'from_name': 'Columby',
      'to': [{
        'email': vars.user.email,
        'name': vars.user.name,
        'type': 'to'
      }],
      'headers': {
        'Reply-To': 'noreply@columby.com'
      },
      'merge_vars': [{
        'rcpt' : vars.user.email,
        'vars': [{
          'name':'TITLE',
          'content':'Welcome to Columby!',
        },{
          'name':'MESSAGE',
          'content':'Hi!<br/>You can log in right away and start using your new account. Please click the button below to login. <br>Or copy and paste this url:<br>' + vars.tokenurl + '<br><br>If you don\'t know what this is about, then someone has probably entered your email address by mistake. Sorry about that.<br><br>Thank you,<br>The Columby team'
        },{
          'name':'LINK',
          'content': vars.tokenurl
        },{
          'name':'LINKTITLE',
          'content': 'Login at Columby'
        }],
      }],
    }
  }, callback);
}


// send a registration email to a user
exports.login = function(vars, callback){

  mandrill_client.messages.sendTemplate({
    'template_name': 'columby-notice-template',
    'template_content' : [{
      'name' : 'Your login token',
      'content' : 'Hi!<br/>There was a request to login. Please click the button below to login. <br>Or copy and paste this url:<br>' + vars.tokenurl + '<br><br>If you did not make this request, just ignore this email.'
    }],
    'message': {
      'html': vars.tokenurl,
      'text': vars.tokenurl,
      'subject': 'Login at Columby',
      'from_email': 'noreply@columby.com',
      'from_name': 'Columby',
      'to': [{
        'email': vars.user.email,
        'name': vars.user.email,
        'type': 'to'
      }],
      'headers': {
        'Reply-To': 'noreply@columby.com'
      },
      'merge_vars': [{
        'rcpt' : vars.user.email,
        'vars': [{
          'name':'TITLE',
          'content':'Your login token',
        },{
          'name':'MESSAGE',
          'content':'Hi!<br/>There was a request to login. Please click the button below to login. <br>Or copy and paste this url:<br>' + vars.tokenurl + '<br><br>If you did not make this request, just ignore this email.'
        },{
          'name':'LINK',
          'content': vars.tokenurl
        },{
          'name':'LINKTITLE',
          'content': 'Login at Columby'
        }],
      }],
    }
  }, callback);
}
