#!/usr/bin/env node

import process from 'node:process'
import { execSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

import { program } from 'commander'
import { minimatch } from 'minimatch'

const checkFilenames = async (configPath = '.immutable') => {
    try {
        const data = await readFile(configPath)

        if (!data) {
            process.exit(0)
        }

        const notAllowedPatterns = data.toString()
            .split(/\r?\n/)
            .filter(Boolean)

        const changedFiles = execSync('git diff --name-only --cached', { encoding: 'utf-8' })
            .split(/\r?\n/)
            .filter(Boolean);

        const notAllowedChangedFilesWithDuplicates = notAllowedPatterns.reduce((result, pattern) => {
            const notAllowedFiles = changedFiles
                .filter(filename => minimatch(filename, pattern))

            return [...result, ...notAllowedFiles]
        }, [])

        const notAllowedChangedFiles = [...new Set(notAllowedChangedFilesWithDuplicates)]

        if (notAllowedChangedFiles.length) {
            const fileNames = notAllowedChangedFiles
                .map(filename => `\n\t${filename}`)

            throw new Error(`Commit rejected! Not allowed to change files: ${fileNames}`)
        }

    } catch (error) {
        console.error(error.message)
        process.exit(1)
    }
}

program
    .argument('[configPath]', 'Path to configuration file (default: .immutable)')
    .action(checkFilenames)

program.parse(process.argv);

