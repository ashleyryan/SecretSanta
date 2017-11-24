# SecretSanta

A node script to generate Secret Santa matches. 

It takes a csv file of Name,email,SignificantOther (without a header row) and generates and emails matches excluding the Significant Other.

To run:
1. Edit smtp.json with your email information and rename to smtp.json
2. `node src/app.js {options}`

Options:
`src` - path to csv
`debug` - (optional) prints out the input names and sample matches
`email` - actually send emails
`smtp` - path to smtp config file
`testemail` - send a test email to test email configuration

To send emails using your gmail address some extra configuration needs to be done:
https://nodemailer.com/usage/using-gmail/
