<script setup lang="ts">
withDefaults(defineProps<{ kind?: string; active?: boolean }>(), { kind: 'cnc' });
</script>
<template>
  <svg class="machine-art" viewBox="0 0 160 105" aria-hidden="true">
    <ellipse cx="80" cy="96" rx="66" ry="6" fill="#597f9e" opacity=".1" />
    <template v-if="kind === 'crane'">
      <path d="M13 30H147V40H13Z" fill="#f4bb39" />
      <path d="M22 40V91M138 40V91" stroke="#dfac2c" stroke-width="9" />
      <path
        d="M33 31V39M52 31V39M71 31V39M90 31V39M109 31V39M128 31V39"
        stroke="#b88a17"
        stroke-width="2"
      />
      <path d="M77 39V68q-10 9 0 14q10 0 8-9" fill="none" stroke="#e3aa17" stroke-width="4" />
      <rect x="65" y="24" width="27" height="15" rx="2" fill="#edb22a" />
      <rect x="13" y="89" width="25" height="6" fill="#7793aa" />
      <rect x="122" y="89" width="25" height="6" fill="#7793aa" />
    </template>
    <template v-else-if="kind === 'pump'">
      <rect x="24" y="85" width="116" height="7" rx="2" fill="#65819a" />
      <path d="M28 70h34v16H28zM55 49h22v37H55z" fill="#96b6d0" />
      <circle cx="59" cy="70" r="24" fill="#a8c4da" stroke="#7898b3" stroke-width="3" />
      <circle cx="59" cy="70" r="14" fill="#d5e5f1" stroke="#85a5bf" stroke-width="3" />
      <circle cx="59" cy="70" r="6" fill="#779bb7" />
      <rect x="83" y="47" width="49" height="37" rx="7" fill="#92b2cd" />
      <path d="M91 51v29m8-29v29m8-29v29m8-29v29m8-29v29" stroke="#6c92b2" stroke-width="3" />
      <path d="M49 47V29h28v10H63v9" fill="#94b7d1" />
      <rect x="45" y="25" width="36" height="7" fill="#b7d1e5" />
    </template>
    <template v-else-if="kind === 'cabinet'">
      <path d="M36 17h83l10 8v68H36z" fill="#a5bed2" />
      <rect x="36" y="17" width="80" height="75" rx="3" fill="#dce8f1" stroke="#9cb5c9" />
      <rect x="44" y="26" width="64" height="56" rx="2" fill="#bccfdf" />
      <rect x="52" y="33" width="47" height="20" rx="2" fill="#477898" />
      <path d="M57 43h10l4-6 5 12 5-7h13" fill="none" stroke="#a9e0f3" stroke-width="2" />
      <circle cx="58" cy="65" r="3" fill="#26c694" />
      <circle cx="73" cy="65" r="3" fill="#f1bc4d" />
      <path d="M97 63v12M47 91v5M108 91v5" stroke="#6c8ca6" stroke-width="3" />
    </template>
    <template v-else>
      <path d="M23 31 34 23h99l9 9v60H23Z" fill="#a6bfd1" />
      <rect
        x="19"
        y="31"
        width="119"
        height="59"
        rx="3"
        fill="#dde8f0"
        stroke="#96b1c7"
        stroke-width="1.5"
      />
      <rect x="26" y="37" width="27" height="43" rx="2" fill="#a5bdcf" />
      <rect x="31" y="42" width="17" height="27" rx="1" fill="#507b98" />
      <path d="m32 43 7-1v26h-7" fill="#98bfd5" />
      <rect x="58" y="33" :width="kind === 'lathe' ? 49 : 43" height="49" rx="2" fill="#5b7890" />
      <rect x="63" y="38" :width="kind === 'lathe' ? 39 : 33" height="37" fill="#25485f" />
      <path d="M80 39v13l-5 4v12h13V55l-5-3V39" fill="#b8cbd8" />
      <rect x="64" y="70" width="32" height="7" fill="#92b3ca" />
      <rect x="110" y="40" width="22" height="35" rx="2" fill="#9ab1c3" />
      <rect x="114" y="44" width="14" height="13" fill="#456b89" />
      <path d="M117 47h8m-8 3h5m-5 3h8" stroke="#a8daed" stroke-width="1" />
      <circle cx="116" cy="64" r="2" fill="#2cc999" />
      <circle cx="124" cy="64" r="2" fill="#efad49" />
      <rect x="28" y="85" width="104" height="7" rx="1" fill="#8eaac0" />
      <rect x="31" y="92" width="18" height="5" fill="#6888a0" />
      <rect x="112" y="92" width="18" height="5" fill="#6888a0" />
      <rect x="69" y="20" width="20" height="12" rx="1" fill="#bbcfde" />
      <rect x="115" y="22" width="5" height="10" rx="2" :fill="active ? '#f05b66' : '#30c992'" />
    </template>
  </svg>
</template>
