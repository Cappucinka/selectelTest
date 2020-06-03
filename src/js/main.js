import noUiSlider from 'nouislider';

const configurationListItem = require('../components/configuration-list-item/configuration-list-item.pug');
const noResult = require('../components/no-result/no-result.pug');
const error = require('../components/error/error.pug');

let isLoading = true;

window.onload = function() {
  let configurationList = [];

  let coreFilterValue = 6;
  let gpuFilterValue = false;
  let raidFilterValue = false;
  let ssdFilterValue = false;

  const coreFilterSlider = document.getElementById('js_filter_core');
  noUiSlider.create(
    coreFilterSlider,
    {
      range: {
        'min': 2,
        '25%': 4,
        '50%': 6,
        '75%': 8,
        'max': 12,
      },
      snap: true,
      connect: [true, false],
      start: coreFilterValue,
      pips: {
        mode: 'values',
        values: [2, 12],
      },
    },
  );

  const render = function(loading, items, coreFilter, gpuFilter, raidFilter, ssdFilter) {
    if (loading) {
      return;
    }

    let filteredItems = items.filter(function(item) {
      return item.cpu.cores * item.cpu.count === coreFilter;
    });

    if (gpuFilter) {
      filteredItems = filteredItems.filter(function(item) {
        return item.gpu;
      });
    }

    if (raidFilter) {
      filteredItems = filteredItems.filter(function(item) {
        return item.disk && item.disk.count >= 2;
      });
    }

    if (ssdFilter) {
      filteredItems = filteredItems.filter(function(item) {
        return item.disk && item.disk.type.toLowerCase() === 'ssd';
      });
    }

    let result = '';

    filteredItems.forEach(function(item) {
      const cpu = item.cpu.name.split(' ');
      item.cpuName = cpu.slice(0, -2).join(' ');
      item.cpuModel = cpu[cpu.length - 2];
      item.cpuGGC = cpu[cpu.length - 1].replace('ГГц', ' ГГц');

      item.priceText = Math.ceil(item.price / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

      result += configurationListItem(item);
    });
    
    if (result) {
      document.getElementById('js_configuration_list').innerHTML = result;
    } else {
      document.getElementById('js_configuration_list').innerHTML = noResult();
    }
  };

  const renderError = function() {
    document.getElementById('js_configuration_list').innerHTML = error();
  };

  coreFilterSlider.noUiSlider.on('update', function(values) {
    coreFilterValue = parseInt(values[0]);

    document
      .getElementById('js_filter_core_label')
      .innerHTML = coreFilterValue + (coreFilterValue > 4 ? ' ядер' : ' ядра');

    render(isLoading, configurationList, coreFilterValue, gpuFilterValue, raidFilterValue, ssdFilterValue);
  });

  document.getElementById('js_filter_gpu').addEventListener('change', function(event) {
    gpuFilterValue = event.currentTarget.checked;
    render(isLoading, configurationList, coreFilterValue, gpuFilterValue, raidFilterValue, ssdFilterValue);
  });

  document.getElementById('js_filter_raid').addEventListener('change', function(event) {
    raidFilterValue = event.currentTarget.checked;
    render(isLoading, configurationList, coreFilterValue, gpuFilterValue, raidFilterValue, ssdFilterValue);
  });

  document.getElementById('js_filter_ssd').addEventListener('change', function(event) {
    ssdFilterValue = event.currentTarget.checked;
    render(isLoading, configurationList, coreFilterValue, gpuFilterValue, raidFilterValue, ssdFilterValue);
  });

  const sendRequest = async function() {
    try {
      await fetch('https://api.jsonbin.io/b/5df3c10a2c714135cda0bf0f/1')
        .then(function(response) {
          if (!response.ok) {
            throw Error(response.statusText);
          }
      
          return response.json();
        })
        .then(function(data) {
          configurationList = data;
          isLoading = false;
          render(isLoading, configurationList, coreFilterValue, gpuFilterValue, raidFilterValue, ssdFilterValue);
        })
        .catch(function(error) {
          error.text().then(function(errorMessage) {
            renderError();
          });
        });
    } catch (error) {
      renderError();
    }
  }

  sendRequest();
};
