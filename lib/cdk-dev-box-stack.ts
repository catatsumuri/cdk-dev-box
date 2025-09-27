import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import * as path from 'path';
import { Construct } from 'constructs';
import { Config } from '../config/config';

export interface CdkDevBoxStackProps extends cdk.StackProps {
  config: Config;
}

export class CdkDevBoxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkDevBoxStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Lookup default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
      isDefault: true,
    });

    // Lookup Debian stable AMI for ARM architecture
    const debianAmi = ec2.MachineImage.lookup({
      name: 'debian-12-arm64-*',
      owners: [config.debianAmiOwner],
      filters: {
        architecture: ['arm64'],
        state: ['available'],
      },
    });

    // セキュリティグループを作成
    const securityGroup = new ec2.SecurityGroup(this, 'InstanceSecurityGroup', {
      vpc,
      description: 'Security group for CDK development bo  instance',
      allowAllOutbound: true
    });

    // SSH アクセスを許可
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    const userdataAsset = new s3assets.Asset(this, 'UserdataAsset', {
      path: path.join(__dirname, '../assets/userdata.sh'),
    });

    const configAsset = new s3assets.Asset(this, 'ConfigAsset', {
      path: path.join(__dirname, '../config/config.json'),
    });

    const userData = ec2.UserData.forLinux();
    userData.addS3DownloadCommand({
      bucket: userdataAsset.bucket,
      bucketKey: userdataAsset.s3ObjectKey,
      localFile: '/tmp/userdata.sh',
    });

    // Download config.json as well
    userData.addS3DownloadCommand({
      bucket: configAsset.bucket,
      bucketKey: configAsset.s3ObjectKey,
      localFile: '/tmp/config.json',
    });

    // Execute the userdata script
    userData.addCommands(
      'chmod +x /tmp/userdata.sh',
      '/tmp/userdata.sh > /var/log/userdata.log 2>&1'
    );

    // Create EC2 instance
    const instance = new ec2.Instance(this, 'DevBoxInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize[config.instanceSize as keyof typeof ec2.InstanceSize]),
      machineImage: debianAmi,
      securityGroup,
      userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            deleteOnTermination: true
          })
        }
      ],
      keyPair: ec2.KeyPair.fromKeyPairName(this, 'KeyPair', config.keyPairName),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // インスタンスロールにCloudFormation権限を追加
    const role = instance.role;
    role.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: [
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:ListStacks",
        "cloudformation:ListStackResources"
      ],
      resources: ["*"]
    }));

    // S3アセットへのアクセス権限を追加
    userdataAsset.grantRead(role);
    configAsset.grantRead(role);

    // Output instance ID and public IP
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'PublicIp', {
      value: instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
    });
  }
}
