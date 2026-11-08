# laboratorio-novantir

Skill `publicar-no-lab`: guides Claude to put a Novantir app on the home lab server (prototype or staging) by following the lab manual kept in the private `servidor` repository (`docs/MANUAL-APP-NO-LAB.md`). The skill itself holds only the workflow and the rules; the manual has the details.

Only useful on a machine that has the `servidor` repository and SSH access to the lab.

## Install

```
/plugin install laboratorio-novantir --marketplace novantir/claude-plugins
```
