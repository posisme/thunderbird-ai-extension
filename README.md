This extension to Thunderbird will allow you to search the current email for a term or terms and it will use an OpenWebUI AI to search the email content and return a summary response.

The prompt used is 

```
Find this text:
${findtext}
within the attached text and give a summary of what is requested about it
```

It attaches the email as a text file so that the prompt is not as long.

The summary is returned in the popup.
