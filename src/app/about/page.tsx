"use client";
import React, { useState } from "react";
import Link from "next/link";
import { renderFooter } from "@/components/shared/footerHelpers";
import {
  ArrowBack as ArrowBackIcon,
  Apps as AppsIcon,
  Home as HomeIcon,
  IntegrationInstructions as DevToolsIcon,
  Assignment as LogIcon,
  Casino as RollIcon,
  Restaurant as RestaurantIcon,
  PhotoCamera as PhotoCameraIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  ColorLens as ColorIcon,
  TextFields as TextIcon,
  NetworkCheck as NetworkIcon,
} from "@mui/icons-material";

export default function AboutPage() {
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const apps = [
    { name: "Home", path: "/", icon: HomeIcon },
    {
      name: "Dev Tools",
      path: "/utilities",
      icon: DevToolsIcon,
      hasSubmenu: true,
      submenu: [
        { name: "Md Editor", path: "/markdown", icon: TextIcon },
        {
          name: "JSON Previewer",
          path: "/utilities/json-previewer",
          icon: CodeIcon,
        },
        {
          name: "Hex/RGB Code",
          path: "/utilities/hex-rgb-converter",
          icon: ColorIcon,
        },
        { name: "Lorem Ipsum", path: "/utilities/lorem-ipsum", icon: TextIcon },
        {
          name: "Network Utilities",
          path: "/utilities/network-tools",
          icon: NetworkIcon,
        },
      ],
    },
    { name: "Brew Log", path: "/brewday", icon: LogIcon },
    { name: "Roll&Write", path: "/rollandwrite", icon: RollIcon },
    { name: "Recipes", path: "/recipes", icon: RestaurantIcon },
    { name: "jM Galleries", path: "/jmgalleries", icon: PhotoCameraIcon },
  ];

  const handleAppSelect = (path: string) => {
    window.location.href = path;
    setIsAppsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-xl bg-white flex-1">
        {/* Header */}
        <div className="flex items-center space-x-2 h-[61px] border-b border-gray-200 px-3">
          <Link href="/">
            <button className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer">
              <ArrowBackIcon sx={{ fontSize: 16 }} />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          </Link>
          <div className="h-4 w-px bg-gray-300" />
          {/* Apps Menu */}
          <div className="relative">
            <button
              onClick={() => setIsAppsMenuOpen(!isAppsMenuOpen)}
              className="px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
              aria-label="Apps Menu"
              aria-expanded={isAppsMenuOpen}
            >
              <AppsIcon sx={{ fontSize: 16 }} />
              Apps
            </button>
            {/* Apps Dropdown */}
            {isAppsMenuOpen && (
              <>
                <button
                  className="fixed inset-0 -z-10 cursor-default"
                  onClick={() => {
                    setIsAppsMenuOpen(false);
                    setOpenSubmenu(null);
                  }}
                  aria-label="Close menu"
                  tabIndex={-1}
                />
                <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm rounded-md shadow-xl border border-white/30 min-w-[200px] overflow-hidden z-50">
                  {apps.map((app) => {
                    const IconComponent = app.icon;
                    const hasSubmenu = app.hasSubmenu && app.submenu;
                    const isSubmenuOpen = openSubmenu === app.name;
                    return (
                      <div key={app.path}>
                        <button
                          onClick={() => {
                            if (hasSubmenu) {
                              setOpenSubmenu(isSubmenuOpen ? null : app.name);
                            } else {
                              handleAppSelect(app.path);
                            }
                          }}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                        >
                          {IconComponent && (
                            <IconComponent sx={{ fontSize: 20 }} />
                          )}
                          <span className="text-sm font-medium flex-1">
                            {app.name}
                          </span>
                          {hasSubmenu && (
                            <ExpandMoreIcon
                              sx={{
                                fontSize: 16,
                                transform: isSubmenuOpen
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            />
                          )}
                        </button>
                        {hasSubmenu && isSubmenuOpen && (
                          <div className="bg-gray-50 border-t border-gray-200">
                            {app.submenu?.map((subItem) => {
                              const SubIconComponent = subItem.icon;
                              return (
                                <button
                                  key={subItem.path}
                                  onClick={() => handleAppSelect(subItem.path)}
                                  className="w-full px-8 py-2 text-left flex items-center gap-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800 text-sm"
                                >
                                  {SubIconComponent && (
                                    <SubIconComponent sx={{ fontSize: 16 }} />
                                  )}
                                  {subItem.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        {/* End Header */}
        <main className="w-full md:w-3/4 mx-auto">
          <div className="py-8 px-6">
            <h1 className="text-3xl font-bold mb-2 text-center">
              Conversational AI Based Web Development
              <br />
              Using GitHub CoPilot and Claude Sonnet 4 Model
            </h1>
            <p className="py-6 text-center">By James McCarthy</p>
            <p className="text-xl text-center lg:text-left">
              In a way, this kind of feels like cheating, but I wanted to see
              how far I could get with developing a web-app using AI tools and
              frameworks with only conversational AI based development. The word
              conversational is being defined as using a{" "}
              <i>casual, know enough to break things</i> tone of voice when
              composing prompts. The result is a fully functional application
              that showcases the power of modern web development in a rapidly
              evolving AI landscape using Microsoft&apos;s VS Code with GitHub
              Copilot and Claude Sonnet 4 model.
            </p>
            <p className="py-8 text-center lg:text-left">
              Technologies used included: Next.js, React, TypeScript,
              Material-UI, Tailwind CSS, MySQL, Tempest Weather Station API,
              oAuth using Google Sign-in, VS Code using GitHub Copilot with
              primarily Claude Sonnet 4 model and some GPT4.1 model and hosted
              at Vercel.
            </p>
            <p className="py-4 text-center text-blue-500">
              <a href="#casestudy">Case Study</a> |{" "}
              <a href="#nextsteps">Next Steps</a> |{" "}
              <a href="#challenges">Challenges</a> |{" "}
              <a href="#changelog">Changelog</a>
            </p>
            <h2 id="casestudy" className="text-xl font-semibold mt-6 mb-2">
              Case Study
            </h2>
            <p>It all started with an idea prompt.</p>
            <p className="py-4">
              I intentionally created the prompt to be written in a casual tone
              with the minimal amount of technical jargon, but enough to be
              dangerous. At first this worked well, but as I iterated
              overinstructions I did find that more technical and specific I was
              the better Claude performed on the first pass. Lets get started
              and you will see how my prompts had to evolve over time in order
              to accomplish the goal.
            </p>
            <p className="bg-gray-100 rounded p-3 text-sm overflow-x-auto font-mono text-orange-500 py-8 px-8 mt-4 mb-4">
              prompt:
              <br />I have an extra domain, hikerbikerwriter, and I want you to
              create a website that represents those three words. They will
              include the following apps. 1) Markdown Editor: with PDF Export,
              2) Brew Day Log: a digital logbook for tracking beer brewing
              sessions. For the homepage I want to include the logo I just made
              with chatGPT centered in the browser as well as vertically aligned
              middle. There should be two buttons linking to the apps.
            </p>
            <div className="flex justify-center py-6 w-full">
              <img
                src="/images/case-study-image1.png"
                alt="Screenshot of the development process"
                className="rounded shadow-lg w-full h-auto max-w-full"
              />
            </div>
            <p className="py-4">
              I watched Claude work in the CoPilot chat panel creating and
              responding to its own prompts. After about 10 minutes he prompted
              with permission to &ldquo;Start a Development Server&ldquo;. I
              clicked the continue button and he opened the VS Code Terminal
              panel and the words &ldquo;npm run dev&ldquo; appeared and
              executed. I was shocked, amazed, impressed and a little panicked.
              Claude interpretted this first prompt so well that it even decided
              on its own to use the Next App router vs Page router. It decided
              to use Tailwindcss for styling and had made every major
              architectural decision for the app and executed it until the build
              was without error.
            </p>
            <p className="py-4">
              The only part it had it trouble with was the UX. For example,
              while it created the initial scaffolding of pages, components and
              css Claude had difficulty creating consistent design elements like
              headers and footers across the first 3 components. So I found the
              header I liked most and cleaned up the tailwindcss then used
              another slightly more technical prompt to help Claude clear
              everything up - fingers crossed.
            </p>
            <p className="bg-gray-100 rounded p-3 text-sm overflow-x-auto font-mono text-orange-500 py-8 px-8 mt-4 mb-4">
              prompt:
              <br />
              the headers could use some cleanup. I like the header in the
              fieldnotes app, so please use that as a reference. Also, change
              the &ldquo;Back Home&ldquo; link to use Material UIs back arrow
              icon. Also, add an &ldquo;Apps&ldquo; menu to the right of the
              back home link separated with a &ldquo;|&ldquo;. The apps link
              should be a dropdown menu with the following items: 1) Markdown
              Editor, 2) Brew Day Log. Each menu item also wil have an icon to
              the left of the label. The dropdown should be styled using
              Material UI components. After separate with another
              &ldquo;|&ldquo; and include the title of the page in bold.
              <br />
              <br />
              prompt:
              <br />
              Great job. Can you now also do this to the other component pages
              so they all look the same? And, can you add a global footer to the
              pages that have the basic Copyright information &ldquo;©/™
              hikerbikerwriter&ldquo; and below that a line that reads
              &ldquo;This project is entirely generated using Co-Pilot AI with
              Claude Sonnet 4 model and Tempest Weather Station API, hosted at
              Vercel.&ldquo;
            </p>
            <p className="py-4">
              Claude did a great job with the header and footer, but I had to
              use some terminology that I know the non-technical-developer
              person I am not sure would have thought to use. These included
              references to tailwindcss and manual editing of their class
              syntax, as well as another reference to the Material UI library
              and the term &ldquo;label&ldquo; to describe the icon location.
            </p>
            <p className="py-4">
              While looking at the homepage I felt it would be cool to show the
              weather conditions and temperature from my personal weather
              station in the backyard. After a quick gogole search I discovered
              the Tempest Weather Station API and was able to get an API key. I
              then asked Claude to integrate it into the homepage and that was
              that I had weather above the mountain peaks and fancy teal to
              white gradient background that claude himself decided would look
              nice.
            </p>
            <p className="py-4">
              One of the things I experimented with was taking a PDF file and
              asking Claude to create an app based on it. I put the PDF into an
              /assets folder so Claude could access it easily and simply asked
              him to create an app based on the PDF. I was surprised at how well
              it worked, but it did take a few iterations to get it right and
              eventually I used shorter prompts to get the desired result. I
              even suggested to use local storage to save the data, which Claude
              did. Another interpretation of the PDF file which Claude created
              on his own was water calculator and how the brew day data is
              entered and displayed. Not only did he create a dynamic form that
              creates individual logging fields but also added optional timer
              functions for each log entry - nice touch Claude - time for bed.
              We will continue this tomorrow.
            </p>
            <div className="flex justify-center py-6 w-full">
              <img
                src="/images/case-study-image2.png"
                alt="Screenshot of the development process"
                className="rounded shadow-lg w-full h-auto max-w-full"
              />
            </div>
            <p className="py-4">
              The next morning while sitting at the fire-pit enjoying a cup of
              coffee and watching the finches play in the fountain I wrote my
              next prompt.
            </p>
            <p className="bg-gray-100 rounded p-3 text-sm overflow-x-auto font-mono text-orange-500 py-8 px-8 mt-4 mb-4">
              prompt:
              <br />
              Recipe Builder: i want a button on the homepage similar to the
              fieldNotes button that will link to the viewer page titled
              Recipes&ldquo;. there will be 2 routes: 1) viewer and 2) builder.
              For both view and builder use the layout structure in FieldNotes
              page.tsx file. the viewer will have public access and the builder
              route will need a google auth password to use. see FieldNotes for
              existing google auth context. Make the Sign-in/Logout the same as
              FieldNotes. when logged recipes in the viewer mode will have an
              edit button and when clicked show the recipe in the builder mode
              for editing. the default view for the viewer will will include a
              filter bar by category and favorites as well as search. if there
              are no recipes than the viewer will show a &ldquo;no
              recipes&ldquo; box with a button to add one. the recipes will be
              shown in a grid format with the photo thumbnail (if not available
              use a generic box with a material ui icon) the title below and
              then below the title the total time which includes the prep time +
              cook time. when you click the tile or thumbnail a detailed view
              will appear. it will show the thumbnail and then a large bold
              title with the prep time | cook time below it. overlayed in the
              top right of the thumbnail will be an icon for marking it favorite
              an sharing. when clicking the sharing it copy the url to the clip
              board. So the URL will need to be a friendly url using the title
              (spaces turned into dashes) Next line under the thumbnail will be
              the author and description. the next section will be accordions
              for ingredients, steps and my notes. when viewing ingredients
              there will be a serving size which can be adjusted and then the
              ingredients will scale to that size using imperial measurements.
              Steps will be outlined as Step1, Step2, etc. if smoker is the
              category there will be icons for temp, time and super smoke. There
              will also be a button for &ldquo;Make Now&ldquo; which will change
              the display into a slideshow card for each step. The last step
              will say &ldquo;Bon Apetite!&ldquo; centered with some cool icon.
              I don’t want to use a database so either flat files in JSON may be
              the best option. I would prefer storing the images as base64 in
              the JSON if possible if not alongside the JSON file. Store the
              data in a folder at /src/data/recipes
            </p>
            <p className="py-4">
              It wasn&apos;t too long and the Recipe Builder app was ready.
              Claude did it all from creating an index viewer and editor page to
              supporting PDF export and image uploads. I was amazed at how
              quickly it was able to put all this together so I thought about my
              next apps: FieldNotes and Roll And Write. I could already envision
              the features I wanted in these apps so having Claude build them
              was a no-brainer. I wrote the prompts for each app similar to the
              Recipe Builder and watched as Claude created the initial layouts
              and components.
              <br />
              <br />
              [image: case-study-image3.png]
            </p>

            <p className="py-4">
              A little addicted at this point and like a crazed hacker in a
              hackathon I knew this app was becoming something that I could
              legit use and share with others, so I added some authentication
              using Google&apos;s oAuth simply by chatting with Claude about my
              ideas and what I wanted. Claude took care of all the Next/react
              stuff but I had to create the API keys and tokens in my Google
              Cloud Admin console. Once that was complete it just worked. And
              what was more astonishing is that I (with my coding friend Claude)
              accomplished that task in about 30 minutes. I couldn&apos;t help
              but think about how much time, google searches and effort this
              would have taken me to do on my own.
            </p>

            <p className="py-4">
              However in order to host this on Vercel and to scale this project
              to a place where it can accommodate multiple users I knew it was
              time to ditch the JSON flat file architecture and move to a more
              robust database solution. This was really going to test how well
              Claude has context of the workspace but also the overall
              architecture of the app which should be high since he has so far
              written 100% of the code. To make it easier for Claude to
              understand the data model I designed a simple MySQL database
              schema which used the current JSON structure inside a JSON typed
              column and then asked Claude to help me implement it.
            </p>

            <p className="bg-gray-100 rounded p-3 text-sm overflow-x-auto font-mono text-orange-500 py-8 px-8 mt-4 mb-4">
              prompt:
              <br />
              so I have an issue with vercel and using flat files so I have
              created a database on my local mysql and want to change the API to
              use it. First, we will keep the current JSON structre and isntead
              of writing it to the file system we simply insert and update the
              row in the new database. The schema for both tables looks like
              this: `CREATE TABLE `fieldnotes` ( `id` int(11) NOT NULL
              AUTO_INCREMENT, `user_email` varchar(255) DEFAULT NULL, `json`
              json DEFAULT NULL, `created` datetime DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 CREATE
              TABLE `recipes` ( `id` int(11) NOT NULL AUTO_INCREMENT,
              `user_email` varchar(255) DEFAULT NULL, `json` json DEFAULT NULL,
              `created` datetime DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`) )
              ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` Can you make the changes to
              the API so that everything is read and written to this database:
              hikerbikerwriter. The database credentials for local are alrady in
              the /lib/db.ts file.
            </p>

            <p className="py-4">
              Mission accomplished in 1 prompt. Claude created the necessary API
              endpoints to interact with the MySQL database as well as
              completely tested the functionality of the app.
            </p>

            <p className="py-4">If you can dream it, Claude can build it</p>

            <h2 id="nextsteps" className="text-xl font-semibold mt-6 mb-2">
              Next Steps
            </h2>
            <ul className="list-disc ml-6 mb-4">
              <li>Code Review</li>
              <li>Optimizations and code efficiency improvements</li>
            </ul>
            <h2 id="challenges" className="text-xl font-semibold mt-6 mb-2">
              Challenges
            </h2>
            <ul className="list-disc ml-6 mb-4">
              <li>Creating a consistent UI and UX experience across apps</li>
              <li>
                Had to make additional requests to Claude for mobile
                Optimizations
              </li>
            </ul>
            <h2 id="changelog" className="text-xl font-semibold mt-6 mb-2">
              Changelog &mdash;{" "}
              <a
                className="text-blue-500"
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/sjamesmccarthy/hikerbikerwriter"
              >
                view on GitHub
              </a>
            </h2>
            <h3 className="font-semibold mt-4 mb-1">v1.5.0</h3>
            <ul className="list-disc ml-6 mb-2">
              <li>
                Updated temperature thresholds for background color gradients.
              </li>
              <li>
                Added content management features for user-generated recipes,
                roll and write, and users.
              </li>
            </ul>
            <h3 className="font-semibold mt-4 mb-1">v1.4.0</h3>
            <ul className="list-disc ml-6 mb-2">
              <li>Added new utility components for Network Tool.</li>
              <li>Enhanced responsiveness for mobile devices.</li>
            </ul>
            <h3 className="font-semibold mt-4 mb-1">v1.3.0</h3>
            <ul className="list-disc ml-6 mb-2">
              <li>Added MySQL database support for Roll And Write.</li>
              <li>Added new user registration and management page.</li>
            </ul>
            <h3 className="font-semibold mt-4 mb-1">v1.2.0</h3>
            <ul className="list-disc ml-6 mb-2">
              <li>Added new features for user authentication.</li>
              <li>Added MySQL database support for Recipes.</li>
            </ul>
            <h3 className="font-semibold mt-4 mb-1">v1.0.0</h3>
            <ul className="list-disc ml-6 mb-2">
              <li>Initial release with basic features.</li>
            </ul>
          </div>
        </main>
      </div>
      {renderFooter("integrated")}
    </div>
  );
}
