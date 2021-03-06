const fs = require("fs").promises;
const yaml = require("js-yaml");
const { execShellAsync } = require("./common");
const { saveLogs } = require("./saveLogs");
module.exports = async function (config, network) {
  try {
    const generateEnvs = {};
    for (const secret of config.publish.secrets) {
      generateEnvs[secret.name] = secret.value;
    }
    const stack = {
      version: "3.8",
      services: {
        [config.build.container.name]: {
          image: `${config.build.container.name}:${config.build.container.tag}`,
          networks: [`${network}`],
          environment: generateEnvs,
          deploy: {
            replicas: 1,
            update_config: {
              parallelism: 0,
              delay: "10s",
              order: "start-first",
            },
            rollback_config: {
              parallelism: 0,
              delay: "10s",
              order: "start-first",
            },
            labels: [
              "managedBy=coolify",
              "branch=" + config.repository.branch,
              "org=" + config.repository.name.split('/')[0],
              "repo=" + config.repository.name.split('/')[1],
              "repoId=" + config.repository.id,
              "domain=" + config.publish.domain,
              "path=" + config.publish.path,
              "traefik.enable=true",
              "traefik.http.services." +
                config.build.container.name +
                `.loadbalancer.server.port=${config.publish.port}`,
              "traefik.http.routers." +
                config.build.container.name +
                ".entrypoints=websecure",
              "traefik.http.routers." +
                config.build.container.name +
                ".rule=Host(`" +
                config.publish.domain +
                "`) && PathPrefix(`" +
                config.publish.path +
                "`)",
              "traefik.http.routers." +
                config.build.container.name +
                ".tls.certresolver=letsencrypt",
              "traefik.http.routers." +
                config.build.container.name +
                ".middlewares=global-compress",
            ],
          },
        },
      },
      networks: {
        [`${network}`]: {
          external: true,
        },
      },
    };
    await fs.writeFile(
      `${config.general.workdir}/stack.yml`,
      yaml.dump(stack)
    );
    await execShellAsync(
      `docker stack deploy --prune -c ${config.general.workdir}/stack.yml ${config.build.container.name}`
    );
  } catch (error) {
    await saveLogs(
      [{ stream: "Error occured during deployment." }, {stream: error.message}],
      config
    );
    throw new Error(error);
  }
};
