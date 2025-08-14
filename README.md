## The Story

In a way, this kind of feels like cheating, but I wanted to see how far I could get with developing a web-app using AI tools and frameworks with only conversational based development. The result is a fully functional application that showcases the power of modern web development.

## The Case Study

It all started with the prompt.

`
I have an extra domain, hikerbikerwriter, and I want you to create a website that represents those three words. They will include the following apps. 1) Roll And Write: a creative writing prompt generator based on two 8 sided dice, 2) Field Notes: a digital notebook for hikers and bikers to record their thoughts, experiences and moods and 3) jM Galleries which will show a thumbnail gallery of fine-art images hosted at jmgalleries.com
`

It built upon this foundation so well that I couldn't stop telling what to build next. The next morning while sitting at the fire-pit enjoying a cup of coffee and watching the finches play in the fountain I wrote my next prompt.

`
Recipe Builder: i want a button on the homepage similar to the fieldNotes button that will link to the viewer page titled Recipes”. there will be 2 routes: 1) viewer and 2) builder. For both view and builder use the layout structure in FieldNotes page.tsx file. the viewer will have public access and the builder route will need a google auth password to use. see FieldNotes for existing google auth context. Make the Sign-in/Logout the same as FieldNotes. when logged recipes in the viewer mode will have an edit button and when clicked show the recipe in the builder mode for editing. the default view for the viewer will will include a filter bar by category and favorites as well as search. if there are no recipes than the viewer will show a “no recipes” box with a button to add one. the recipes will be shown in a grid format with the photo thumbnail (if not available use a generic box with a material ui icon) the title below and then below the title the total time which includes the prep time + cook time. when you click the tile or thumbnail a detailed view will appear. it will show the thumbnail and then a large bold title with the prep time | cook time below it. overlayed in the top right of the thumbnail will be an icon for marking it favorite an sharing. when clicking the sharing it copy the url to the clip board. So the URL will need to be a friendly url using the title (spaces turned into dashes) Next line under the thumbnail will be the author and description. the next section will be accordions for ingredients, steps and my notes. when viewing ingredients there will be a serving size which can be adjusted and then the ingredients will scale to that size using imperial measurements. Steps will be outlined as Step1, Step2, etc. if smoker is the category there will be icons for temp, time and super smoke. There will also be a button for “Make Now” which will change the display into a slideshow card for each step. The last step will say “Bon Apetite!” centered with some cool icon. I don’t want to use a database so either flat files in JSON may be the best option. I would prefer storing the images as base64 in the JSON if possible if not alongside the JSON file. Store the data in a folder at /src/data/recipes
`

And it built it, and before I knew it this app was becoming something real. So I added some authentication using Google's oAuth. Claude took care of al lthe Next/react stuff but I had to create the API keys and tokens in my Google Cloud Admin console. Once that was complete it just worked. And what was more astonishing is that I accomplished that task by talking to Claude in about 30 minutes. So I asked myself what's next. 

## Technology Stack

- Next.js
- React
- TypeScript
- Material-UI
- Tailwind CSS
- MySQL
- Tempest Weather Station API
- oAuth using Google Sign-in
- Vercel
- VS Code using GitHub Copilot with primarily Claude Sonnet 4 model and some GPT4.1 model.

## Next Steps

- Code Review
- Optimizations and code efficiency improvements

## Changelog

### v1.5.0

- Updated temperature thresholds for background color gradients.
- Added content management features for user-generated recipes, roll and write, and users.

### v1.4.0

- Added new utility components for Network Tool.
- Enhanced responsiveness for mobile devices.

### v.1.3.0

- Added MySQL database support for Roll And Write.
- Added new user registration and management page.

### v1.2.0

- Added new features for user authentication.
- Added MySQL database support for Recipes.

### v1.0.0

- Initial release with basic features.
