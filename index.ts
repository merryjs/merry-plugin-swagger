import { Plugin } from '@merryjs/cli/lib/plugin'
import { generatePaths } from '@merryjs/swagger'
import changeCase from 'change-case'
import fs from 'fs-extra'
import path from 'path'

/**
 * SwaggerAnswers
 */
export interface SwaggerAnswers {
  name: string
}
export interface SwaggerOptions {
  api: string
  pattern?: string
  dist: string
  tpl: string
  ext: '.ts' | '.tsx'
}
export default (api: Plugin) => {
  api
    .command('swagger')
    .option('-A, --api [value]', 'swagger api')
    .option('-P, --pattern [value]', 'filter path by pattern')
    .option('-D, --dist [value]', 'file writes to')
    .option('-T, --tpl [value]', 'Provide your template if needed')
    .option('-E, --ext [value]', 'file extension defaults to .ts')
    .action(async (name: string, options: SwaggerOptions) => {
      if (!options.dist) {
        api.log('The dist param are required so swagger can write to')
        api.outputHelp()
        return
      }
      if (!options.api) {
        api.log('The api param are required so swagger can read from')
        api.outputHelp()
        return
      }

      const result = await generatePaths(options.api, {
        definitionName: '{path}',
      })

      let tpl = './api.tpl'
      if (options.tpl) {
        tpl = fs.readFileSync(path.join(process.cwd(), options.tpl), 'utf-8')
      }
      for (const key in result) {
        if (result.hasOwnProperty(key)) {
          if (options.pattern && new RegExp(options.pattern, 'i').test(key)) {
            continue
          }
          await api.tmplWithFormat(
            tpl,
            path.join(
              api.conf.dist,
              options.dist,
              `${changeCase.pathCase(key)}${options.ext || '.ts'}`
            ),
            { definitions: result[key] },
            { parser: 'typescript' }
          )
        }
      }
    })
}
