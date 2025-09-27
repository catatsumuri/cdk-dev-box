#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import { CdkDevBoxStack } from '../lib/cdk-dev-box-stack';
import { Config } from '../config/config';

function loadConfig(): Config {
  const configPath = path.join(__dirname, '..', 'config', 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }
  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent) as Config;
}

const config = loadConfig();
const app = new cdk.App();

new CdkDevBoxStack(app, 'CdkDevBoxStack', {
  env: {
    account: config.account,
    region: config.region,
  },
  config,
});
