<template>
  <q-page class="q-pa-md bg-grey-1">
    <div class="row q-mb-md">
      <div class="col-12">
        
          <template>
            <q-icon name="bolt" color="amber-8" />
          
            <q-btn round dense flat icon="subdirectory_arrow_left" @click="handleMagicCommand" />
          </template>
      
      </div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-6">
        <q-card flat bordered class="shadow-2">
          <q-tabs v-model="currentTab" class="bg-primary text-white" align="justify">
            <q-tab name="sql" icon="database" label="SQL 변환기" />
            <q-tab name="linux" icon="terminal" label="Linux 조합" />
            <q-tab name="text" icon="edit" label="텍스트 정제" />
          </q-tabs>

          <q-tab-panels v-model="currentTab" animated>
            <q-tab-panel name="sql">
              <div class="row q-col-gutter-sm q-mb-md">
                <q-select 
                  v-model="sqlConfig.mode" 
                  :options="['INSERT', 'UPDATE', 'DELETE', 'SELECT_IN']" 
                  label="쿼리 모드" 
                  dense outlined class="col-4" 
                />
                <q-input v-model="sqlConfig.tableName" label="테이블명" dense outlined class="col-4" />
                <q-input 
                  v-if="sqlConfig.mode !== 'INSERT'" 
                  v-model="sqlConfig.whereCol" 
                  label="기준 컬럼(WHERE)" 
                  dense outlined class="col-4" 
                />
                <q-select 
                  v-else
                  v-model="sqlConfig.dbType" 
                  :options="['Altibase', 'Goldilocks', 'MySQL']" 
                  label="DB 타입" 
                  dense outlined class="col-4" 
                />
              </div>
              <q-input v-model="inputData" type="textarea" outlined label="데이터 붙여넣기 (Tab 구분)" rows="12" />
              <q-btn color="primary" label="SQL 실행 및 생성" class="full-width q-mt-md" @click="transformToSQL" />
            </q-tab-panel>

            <q-tab-panel name="linux">
              <q-input v-model="linuxConfig.path" label="로그 파일 경로" outlined dense class="q-mb-sm" />
              <q-input v-model="linuxConfig.grep" label="포함할 단어 (grep)" outlined dense class="q-mb-sm" />
              <q-input v-model="linuxConfig.exclude" label="제외할 단어 (grep -v)" outlined dense class="q-mb-sm" />
              <q-btn color="secondary" label="명령어 조합" class="full-width" @click="transformToLinux" />
            </q-tab-panel>

            <q-tab-panel name="text">
              <q-input v-model="inputData" type="textarea" outlined label="처리할 텍스트 입력" rows="12" />
              <div class="row q-gutter-sm q-mt-sm">
                <q-btn label="모든 공백 제거" outline @click="cleanText('no-space')" />
                <q-btn label="중복 라인 제거" outline @click="cleanText('dedup')" />
                <q-btn label="쉼표(CSV) 변환" outline @click="cleanText('csv')" />
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card flat bordered class="shadow-2 full-height bg-white">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6 text-primary">변환 결과 ({{ currentTab.toUpperCase() }})</div>
            <q-space />
            <q-btn icon="content_copy" flat round @click="copyClipboard" color="grey-7" />
          </q-card-section>

          <div class="q-ma-md bg-amber-1 text-center flex flex-center" style="height: 100px; border: 2px dashed #ffb300;">
            <div>
              <div class="text-bold">Kakao AdFit 광고 위치</div>
              <div class="text-caption">수익 발생을 위해 이곳에 스크립트를 삽입하세요.</div>
            </div>
          </div>

          <q-card-section>
            <div class="result-box q-pa-md rounded-borders bg-dark text-white shadow-inner">
              <pre style="white-space: pre-wrap; word-break: break-all; margin: 0; font-size: 0.9em;">{{ resultData || '입력 대기 중...' }}</pre>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';

const $q = useQuasar();
const currentTab = ref('sql');
const inputData = ref('');
const resultData = ref('');


// 설정값
const sqlConfig = ref({ mode: 'INSERT', tableName: 'TEMP_TBL', dbType: 'Altibase', whereCol: 'ID' });
const linuxConfig = ref({ path: '/logs/app.log', grep: '', exclude: '' });



// [SQL] 변환 로직 (다양한 모드)
// [SQL] 변환 로직 (다양한 모드)
const transformToSQL = () => {
  const lines = inputData.value.split('\n').filter(l => l.trim());
  resultData.value = lines.map(line => {
    const cols = line.split('\t').map(c => c.trim());
    const quotedValues = cols.map(c => `'${c}'`);

    switch (sqlConfig.value.mode) {
      case 'INSERT':
        return `INSERT INTO ${sqlConfig.value.tableName} VALUES (${quotedValues.join(', ')});`;
      case 'UPDATE':
        return `UPDATE ${sqlConfig.value.tableName} SET COL_NAME = '${cols[1]}' WHERE ${sqlConfig.value.whereCol} = '${cols[0]}';`;
      case 'DELETE':
        return `DELETE FROM ${sqlConfig.value.tableName} WHERE ${sqlConfig.value.whereCol} = '${cols[0]}';`;
      case 'SELECT_IN': { // <--- 중괄호 추가
        const inVals = lines.map(l => `'${l.trim()}'`).join(', ');
        return `SELECT * FROM ${sqlConfig.value.tableName} WHERE ${sqlConfig.value.whereCol} IN (${inVals});`;
      } // <--- 중괄호 추가
      default: return '';
    }
  }).join('\n');
};

// [LINUX] 명령어 조합
const transformToLinux = () => {
  let cmd = `tail -1000 ${linuxConfig.value.path}`;
  if (linuxConfig.value.grep) cmd += ` | grep '${linuxConfig.value.grep}'`;
  if (linuxConfig.value.exclude) cmd += ` | grep -v '${linuxConfig.value.exclude}'`;
  resultData.value = cmd;
};

// [TEXT] 정제 로직
const cleanText = (type) => {
  if (type === 'no-space') {
    resultData.value = inputData.value.replace(/\s+/g, '');
  } else if (type === 'dedup') {
    resultData.value = [...new Set(inputData.value.split('\n'))].join('\n');
  } else if (type === 'csv') {
    resultData.value = inputData.value.split('\n').map(l => l.trim()).join(',');
  }
};

const copyClipboard = () => {
  copyToClipboard(resultData.value).then(() => {
    $q.notify({ message: '결과가 복사되었습니다!', color: 'positive', position: 'top', timeout: 800 });
  });
};
</script>

<style scoped>
.result-box {
  min-height: 400px;
  border-left: 5px solid #1976d2;
  font-family: 'Consolas', 'Monaco', monospace;
}
</style>