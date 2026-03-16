---@type overseer.TemplateDefinition[]
local templates = {
  {
    name = "Export Samsung data",
    builder = function()
      local root_dir = vim.fn.getcwd()
      --@type overseer.TaskDefinition
      local task = {
        cmd = { "node", root_dir .. "/node_modules/ts-node/dist/bin.js" },
        args = {
          root_dir .. "/src/cli.ts",
          "--input=" .. root_dir .. "/data/samsunghealth",
          "--output=./data",
          "--config-file=./data/config.yml",
        },
        cwd = root_dir,

        components = { { "open_output", direction = "dock", on_start = "always", focus = true }, "default" },
      }
      return task
    end,
    desc = "export samsunghealth data",
  },
}

return templates
