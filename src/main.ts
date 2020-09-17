import * as core from '@actions/core'
import { create, UploadOptions } from '@actions/artifact'
import { dirname } from 'path'
import { promises as fs } from 'fs'

async function run(): Promise<void> {
  try {
    const workspace = process.env.GITHUB_WORKSPACE
    const eventPath = process.env.GITHUB_EVENT_PATH
    const commandPath = `${workspace}/command.json`

    if (!eventPath) {
      core.setFailed(
        'Unable to find event payload path. Environment variable GITHUB_EVENT_PATH is undefined.'
      )
    } else {
      const buffer = await fs.readFile(eventPath)
      const event = JSON.parse(buffer.toString())
      const command = event.client_payload

      if (!command) {
        core.setFailed('Unable get command from event payload.')
      } else {
        await fs.writeFile(commandPath, JSON.stringify(command))

        const artifactClient = create()
        const options: UploadOptions = {
          continueOnError: false
        }

        const uploadResponse = await artifactClient.uploadArtifact(
          'command',
          [commandPath],
          dirname(commandPath),
          options
        )

        if (uploadResponse.failedItems.length > 0) {
          core.setFailed(
            `An error was encountered when uploading ${uploadResponse.artifactName}. There were ${uploadResponse.failedItems.length} items that failed to upload.`
          )
        } else {
          core.info(`Artifact ${uploadResponse.artifactName} has been successfully uploaded!`)
        }

        core.setOutput('command', command)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
