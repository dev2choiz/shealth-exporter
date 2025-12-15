# Samsung Health CLI Parser

This project is a CLI tool that parses Samsung Health exports and generates JSON files containing exercises data and compressed data.

## Installation

Clone the repository:

```
git clone github.com/dev2choiz/samsung-health-parser
cd samsung-health-parser
```

Install dependencies:

```
npm install
```

Run the CLI:
```
npx ts-node src/cli.ts --input=<samsung health export path> --output=./data
```
