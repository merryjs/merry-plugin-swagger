import {Plugin} from '@merryjs/cli/lib/plugin'
import {generatePaths} from '@merryjs/swagger'
import path from 'path'
import changeCase from 'change-case'

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
  ext: '.ts'|'.tsx'
}
export default (api: Plugin) => {
  api.command('swagger [name]')
      .option('-A, --api [value]', 'swagger api')
      .option('-P, --pattern [value]', 'filter path by pattern')
      .option('-D, --dist [value]', 'file writes to')
      .option('-T, --tpl [value]', 'Provide your template if needed')
      .option('-E, --ext [value]', 'file extension defaults to .ts')
      .action(async (name: string, options: SwaggerOptions) => {
        if (!options.dist) {
          api.log('The dist param are required so swagger can write files to')
          return
        }
        if (!options.api) {
          api.log('The api param are required so swagger can read from')
          return
        }

        const result = await generatePaths(options.api, {
          definitionName: '{path}',
        })

        for (const key in result) {
          if (result.hasOwnProperty(key)) {
            if (options.pattern && new RegExp(options.pattern, 'i').test(key)) {
              continue
            }

            await api.tmplWithFormat(
                './api.tpl',
                path.join(
                    api.conf.dist, options.dist,
                    `${changeCase.pathCase(key)}${options.ext || '.ts'}`),
                {definitions: result[key]}, {parser: 'typescript'})
          }
        }
      })
}
