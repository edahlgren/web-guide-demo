const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');

const cli = require('command-line-args');

const yaml = require('js-yaml');
const { JSDOM } = require("jsdom");
const mustache = require('mustache');
const logSymbols = require('log-symbols');


/////////////////////////////////////////////////////////////////////////////////////////////


const cliSpec = [
    { name: 'config' },
    { name: 'out' }
];

main();


/////////////////////////////////////////////////////////////////////////////////////////////


function main() {
    
    // Parse args
    const args = cli(cliSpec);

    // Check args
    if (!args.config) {
        console.log("missing --config: need to pass a config file");
        process.exit(1);
    }
    if (!fs.existsSync(args.config)) {
        console.log("config file (--config) doesn't exist");
        process.exit(1);
    }
    if (!args.out) {
        console.log("missing --out: need to pass an out directory");
        process.exit(1);
    }

    let config = yaml.safeLoad(fs.readFileSync(args.config, 'utf8'));
    config.out = args.out;

    exec(config);
    process.exit(0);
}

function exec(config) {
    
    console.log("", "Templating html for", config.out, "...", "\n");
    
    fsExtra.ensureDirSync(path.join(config.out, "commands"));
    fsExtra.ensureDirSync(path.join(config.out, "guides"));

    let nav_paths = {
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
    
    // Read in the html template
    let t = fs.readFileSync(config.template, 'utf8');

    // Template the index
    template({
        input: config.index,
        template: t,
        nav: nav_paths,
        out: path.join(config.out, "index.html")
    });

    // Template each of the commands
    config.commands.forEach(function(command_path) {
        template({
            input: command_path,
            template: t,
            nav: nav_paths,
            out: path.join(config.out, "commands", path.basename(command_path))
        });
    });

    console.log("");    
}

function template(config) {
    let text = fs.readFileSync(config.input, 'utf8');
    let html = mustache.render(config.template, {
        nav: config.nav,
        content: text
    });
    fs.writeFileSync(config.out, html, 'utf8');
    console.log(" ", logSymbols.success, config.out);
}
