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
    
    fsExtra.ensureDirSync(path.join(config.out, "command"));
    fsExtra.ensureDirSync(path.join(config.out, "spec"));
    
    // Read the files and parse info
    let index = file_info(config.index);
    let commands = config.commands.map(file_info);
    let specs = config.specs.map(file_info);
    
    // Create the navigation info
    let nav = {
        index: {
            title: index.title,
            desc: index.description,
            path: "/index.html"
        },
        commands: commands.map(function(command) {
            return {
                title: command.title,
                desc: command.description,
                path: "/command/" + command.base
            };
        }),
        specs: specs.map(function(spec) {
            return {
                title: spec.title,
                desc: spec.description,
                path: "/spec/" + spec.base
            };
        })
    };

    // Read in the html template
    let t = fs.readFileSync(config.template, 'utf8');

    // Template the index file
    template(t, nav, index.text,
             path.join(config.out, "index.html"));

    // Template each command file
    commands.forEach(function(command) {
        template(t, nav, command.text,
                 path.join(config.out, "command", command.base));
    });

    // Template each spec file
    specs.forEach(function(spec) {
        template(t, nav, spec.text,
                 path.join(config.out, "spec", spec.base));
    });

    console.log("");    
}

function template(tmpl, nav, content, out) {
    let html = mustache.render(tmpl, {
        nav: nav,
        content: content
    });
    fs.writeFileSync(out, html, 'utf8');
    console.log(" ", logSymbols.success, out);
}

function file_info(file) {
    // Read in the snippet
    let text = fs.readFileSync(file, 'utf8');
    
    // Parse the snippet looking for a title and description
    let info = find_info(text);
    
    // Parse the basename of the file
    let base = path.basename(file);
    
    return {
        base: base,
        text: text,
        title: info.title,
        description: info.desc
    };
}

function find_header_text(text) {
    const dom = new JSDOM(text);
    
    let header = dom.window.document.querySelector('h1');
    if (!header) {
        console.log("Failed to find h1");
        process.exit(1);
    }

    return header.textContent;
}

function find_info(text) {
    const dom = new JSDOM(text);
    
    let header = dom.window.document.querySelector('h1');
    if (!header) {
        console.log("Failed to find h1");
        process.exit(1);
    }
        
    let next = header.nextSibling;
    let has_desc = false;
    while (next) {
        if (!next.tagName) {
            next = next.nextSibling;
            continue;
        }
        
        if (next.tagName == "P") {
            has_desc = true;
            break;
        }
        
        console.log("Failed to find paragraph after h1, got <" + next.tagName + "> instead");
        break;
    }
    
    return {
        title: header.textContent,
        desc: (has_desc ? next.textContent : "")
    };
}
