// Deterministic local assembly only: no image generation, downloads or save edits.
const {spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),verifyOnly=process.argv.includes('--verify');
const jobs=[...(verifyOnly?[]:['build-ui-components.cjs','build-ui-shell.cjs','build-nine-slice.cjs','build-common-scroll.cjs','build-barracks-body.cjs']),'verify-ui-assets.cjs','verify-navigation.cjs'];
for(const job of jobs){
 const result=spawnSync(process.execPath,[path.join(__dirname,job)],{cwd:root,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0){process.exitCode=result.status??1;break;}
}
