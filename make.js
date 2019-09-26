const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');

const cli = require('command-line-args');
const mustache = require('mustache');
const logSymbols = require('log-symbols');

const cliSpec = [
    { name: 'template'},
    { name: 'input' },
    { name: 'output' }
];

const nav_paths = {
    index: "/index.html",
    guides: {
        run: "/guides/run.html",
        change: "/guides/change.html",
        learn: "/guides/learn.html",
        configure: "/guides/configure.html"
    },
    commands: {
        shell: "/commands/shell.html",
        browse: "/commands/browse.html",
        run: "/commands/run.html",
        build: "/commands/build.html",
        share_sync: "/commands/share_sync.html",
        check: "/commands/check.html"
    }
};

//////////////////////////////////////////////////////////////////////////

main();

//////////////////////////////////////////////////////////////////////////

function main() {
    
    // Parse args
    const args = cli(cliSpec);

    // Check args
    if (!args.template) {
        console.log("missing --template: need to pass an html template");
        process.exit(1);
    }
    if (!fs.existsSync(args.template)) {
        console.log("html template (--template) doesn't exist");
        process.exit(1);
    }
    if (!args.input) {
        console.log("missing --input: need to pass input dir");
        process.exit(1);
    }
    if (!fs.existsSync(args.input)) {
        console.log("input dir (--input) doesn't exist");
        process.exit(1);
    }
    if (!args.output) {
        console.log("missing --output: need to pass an output directory");
        process.exit(1);
    }
    if (!fs.existsSync(args.output)) {
        console.log("output dir (--output) doesn't exist");
        process.exit(1);
    }

    fsExtra.ensureDirSync(path.join(args.output, "commands"));
    fsExtra.ensureDirSync(path.join(args.output, "guides"));

    // Read in the html template
    let template = fs.readFileSync(args.template, 'utf8');

    // Render the index
    render({
        template: template,
        input: path.join(args.input, "index.html"),
        output: path.join(args.output, "index.html")
    });

    // Render each of the guides
    let guides = path.join(args.input, "guides");
    fs.readdirSync(guides).forEach(function(guide) {
        render({
            template: template,
            input: path.join(guides, guide),
            output: path.join(args.output, "guides", guide)
        });
    });
    

    // Render each of the commands
    let commands = path.join(args.input, "commands");
    fs.readdirSync(commands).forEach(function(command) {
        render({
            template: template,
            input: path.join(commands, command),
            output: path.join(args.output, "commands", command)
        });
    });
}

function render(config) {
    let text = fs.readFileSync(config.input, 'utf8');
    let html = mustache.render(config.template, {
        nav: nav_paths,
        content: text
    });
    fs.writeFileSync(config.output, html, 'utf8');
    console.log(" ", logSymbols.success, config.output);
}
