import express, { Express, Request, Response } from "express";
import nodemailer from "nodemailer";
import { loadEnv, env } from "./env";
import cors from "cors";
import * as fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { actions } from "./types/models.types";

loadEnv();

const { PORT, EMAIL_ID, EMAIL_PASSWORD, SMTP_SERVICE } = env;

const app: Express = express();

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: SMTP_SERVICE,
  auth: {
    user: EMAIL_ID,
    pass: EMAIL_PASSWORD
  }
});

const actions: actions = {
  notice: "./templates/signup.html",
  recover: "./templates/recover.html",
  welcome: "./templates/signup.html",
  newmail: "./templates/newmail.html",
}

app.get("/", (req: Request, res: Response) => {
  res.status(200).send({message: "Welcome to the mailer api. Kindly see the docs for usage instructions."});
});

app.post("/api/v1/sendmail", (req: Request, res: Response) => {
  try {
    const { actionType, userEmail, subject, firstname, gac, body } = req.body;
    const filePath = path.join(__dirname, actions[actionType as keyof actions]);
    const source = fs.readFileSync(filePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    //do replacements here
    let replacements;
    if (actionType === "newmail") {
      replacements = {
        subject,
        body
      }
    } else {
      replacements = {
          firstname,
          codes: gac
      };
    }
    const htmlToSend = template(replacements);
    const mailOptions = {
      from: EMAIL_ID,
      to: userEmail,
      subject: subject,
      html: htmlToSend,
    };

    transporter.sendMail(mailOptions, function(error, info){      
      if (error) {
        if (actionType === "newmail") {
          return res.status(400).send({message: `Failed to send mail!\nPlease contact admin!`})!
        }
        return res.status(400).send({message: `Recovery failed!\nYou must have provided an 
        invalid email at signup.\nPlease contact admin!`})
      } else {
        let message: string;
        actionType === "welcome" ?
          message = "Account creation successful.\nPlease check your email for more details." :
          actionType === "notice" ?
          message = "Notice sent successfully" : 
          actionType === "newmail" ?
          message = "Mail sent successfully!" :
          message = "Account recovery successful!\nCheck your email for further instrutions!";
        return res.status(200).send({message});
      }
    });
  } catch (error) {
    return res.status(400).send({message: "Incorrect parameter(s) supplied!", error})
  }
});

app.listen(PORT, () => console.log("App is listening on port ", PORT));