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
  ext: string
}
export default (api: Plugin) => {
  api
    .command('swagger [name]')
    .option('-A, --api [value]', 'swagger api')
    .option('-P, --pattern [value]', 'filter path by pattern')
    .option('-D, --dist [value]', 'file writes to')
    .option('-T, --tpl [value]', 'Provide your template if needed')
    .option('-E, --ext [value]', 'file extension without [.] defaults to ts')
    .action(async (name: string, options: SwaggerOptions) => {
      if (!options) {
        api.outputHelp()
        return
      }
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
        tpl = path.join(process.cwd(), options.tpl)
      }
      for (const key in result) {
        if (result.hasOwnProperty(key)) {
          if (options.pattern && new RegExp(options.pattern, 'i').test(key)) {
            continue
          }
          // export interface GenerateResult {
          // 	responses: string
          // 	parameters: string
          // 	path: string
          // 	summary?: string
          // 	definitionEntityName?: string
          // 	definitionParamsName?: string
          // 	operation: string
          // }
          // const actions = {
          // 	isGet,
          // 	isPut,
          // 	isPost,
          // 	isDelete,
          // 	isOptions,
          // 	isHead,
          // 	isPatch,
          // }
          const paths = key.split('/')
          let folder = ''
          let p = ''
          if (paths.length > 1) {
            folder = paths[0]
            p = paths.filter((_, index) => index !== 0).join('/')
          } else {
            p = key
          }
          const fullPath =
            (folder ? changeCase.snakeCase(folder) + '/' : '') +
            changeCase.snakeCase(p)
          await api.tmplWithFormat(
            tpl,
            path.join(
              api.conf.dist,
              options.dist,
              `${fullPath}.${options.ext || 'ts'}`
            ),
            { definitions: result[key] },
            { parser: 'typescript' }
          )
        }
      }
    })
}
