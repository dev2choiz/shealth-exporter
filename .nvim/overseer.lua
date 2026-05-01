---@module 'overseer'
---@type overseer.TemplateDefinition[]
local templates = {
  {
    name = "Export Samsung data",
    builder = function()
      ---@type overseer.TaskDefinition
      local task = {
        cmd = { "node", "${workspaceFolder}/node_modules/ts-node/dist/bin.js" },
        args = {
          "${workspaceFolder}/src/cli.ts",
          "shealth-exporter",
          "--input=${workspaceFolder}/data/samsunghealth",
          "--output=./data",
          "--config-file=./data/config.yml",
        },
        cwd = "${workspaceFolder}",

        components = { { "open_output", direction = "dock", on_start = "always", focus = true }, "default" },
      }
      return task
    end,
    desc = "export samsunghealth data",
  },
}

return templates
