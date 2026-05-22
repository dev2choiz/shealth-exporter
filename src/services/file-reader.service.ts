import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { parse } from 'yaml';

@Injectable()
export class FileReaderService {
  async findExerciseCSV<T extends Record<string, unknown>>(
    folderPath: string,
    lastExercises: number,
    filterCb?: (item: T) => boolean,
  ): Promise<ReadonlyArray<T>> {
    try {
      const stats = await fs.stat(folderPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path exists but is not a directory: ${folderPath}`);
      }
    } catch (err) {
      throw new Error(
        `Folder not found: ${folderPath}. Error: ${err instanceof Error ? err.message : err}`,
      );
    }

    let files: string[];
    try {
      files = await fs.readdir(folderPath);
    } catch (err) {
      throw new Error(
        `Failed to read directory ${folderPath}: ${err instanceof Error ? err.message : err}`,
      );
    }

    const csvFile = files.find(
      (file) =>
        file.startsWith('com.samsung.shealth.exercise') &&
        file.endsWith('.csv'),
    );

    if (!csvFile) {
      throw new Error(`Exercise CSV file not found in folder: ${folderPath}`);
    }

    try {
      return await this.readCSV<T>(
        path.join(folderPath, csvFile),
        1,
        lastExercises,
        filterCb,
      );
    } catch (err) {
      throw new Error(
        `Failed to read CSV file ${csvFile}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  readFile(filePath: string) {
    return fs.readFile(filePath, { encoding: 'utf-8' });
  }

  async readYAML<T>(filePath: string) {
    return parse(await this.readFile(filePath)) as T | undefined;
  }

  async readJSON<T>(filePath: string) {
    return JSON.parse(await this.readFile(filePath)) as T;
  }

  private async readCSV<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(
    filePath: string,
    headerLine: number,
    lastExercises: number,
    filterCb?: (item: T) => boolean,
  ) {
    const content = await this.readFile(filePath);
    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length <= headerLine) return [];

    const header = lines[headerLine];

    const dataLines = lines.slice(headerLine + 1);

    const parsedLines = parseToRecords<T>([header, ...dataLines]);

    const filteredLines = filterCb ? parsedLines.filter(filterCb) : parsedLines;

    const selected =
      lastExercises > 0 ? filteredLines.slice(-lastExercises) : filteredLines;

    return selected;
  }

  async readXML<T>(filename: string) {
    const xml = await fs.readFile(filename, 'utf-8');

    const parser = new XMLParser({
      ignoreAttributes: false,
      processEntities: false,
    });

    return parser.parse(xml) as T;
  }
}

const parseToRecords = <
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  lines: ReadonlyArray<string>,
): ReadonlyArray<T> => {
  if (lines.length === 0) return [];

  const headers = lines[0].split(',');

  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ?? '';
    });

    return obj as T;
  });
};
