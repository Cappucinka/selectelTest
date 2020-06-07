const configurationListItem = require('../components/configuration-list-item/configuration-list-item.pug');
const noResult = require('../components/no-result/no-result.pug');
const error = require('../components/error/error.pug');

let isLoading = true;

window.onload = function() {
  let configurationList = [];

  let currentFilters = {
    sliderCores: 6,
    checkboxGpu: false,
    checkboxRaid: false,
    checkboxSsd: false,
  };
  
  const render = function(loading, list, filters) {
    if (loading) {
      return;
    }

    let filteredData = list;

    if (filters.sliderCores) {
      document.getElementById('js_filter_core_label').innerHTML = filters.sliderCores + (filters.sliderCores > 4 ? ' ядер' : ' ядра');

      filteredData = filteredData.filter(function(item){
        return item.cpu && (item.cpu.count * item.cpu.cores === filters.sliderCores);
      });
    }
  
    if (filters.checkboxGpu) {
      filteredData = filteredData.filter(function(item){
        return Boolean(item.gpu);
      });
    }
  
    if (filters.checkboxRaid) {
      filteredData = filteredData.filter(function(item){
        return item.disk && item.disk.count >= 2;
      });
    }
  
    if (filters.checkboxSsd) {
      filteredData = filteredData.filter(function(item){
        return item.disk && item.disk.type === 'SSD';
      });
    }

    if (filteredData.length === 0) {
      document.getElementById('js_configuration_list').innerHTML = noResult();
      return;
    }
  
    let result = filteredData.reduce(function(total, current) {
      let arr = current.cpu.name.split(' ');
      current.cpuName = arr.slice(0, -2).join(' ');
      current.cpuModel = arr[arr.length - 2];
      current.cpuGGC = arr[arr.length - 1];

      current.priceText = String(current.price / 100)
        .split('')
        .reverse()
        .reduce(
          function(total, item, index) {
            if ((index + 1) % 3 === 0) {
              return ' ' + item + total;
            }

            return item + total;
          },
          '',
        );
      return total + configurationListItem(current);
    }, '');

    document.getElementById('js_configuration_list').innerHTML = result;
  }

  const renderError = function() {
    document.getElementById('js_configuration_list').innerHTML = error();
  };

  render(isLoading, configurationList, currentFilters);

  const initSlider = function(initValue) {
    let slider = document.querySelector('.slider__line');
    let item = slider.querySelector('.slider__handle');
    let progress = slider.querySelector('.slider__progress');
  
    let range = [2, 4, 6, 8, 12];
    let step = 100 / (range.length - 1);
    let stepRanges = range.map(function(item, index) {
      let obj = {
        value: item,
        start: ((index - 1) * step) + (step / 2),
        end: (index * step) + (step / 2),
      };
      if (obj.start < 0) {
        obj.start = 0;
      }
      if (obj.end > 100) {
        obj.end = 100;
      }
      return obj;
    });
  
    let sliderClientCoords = slider.getBoundingClientRect();
    let sliderCoords = {};
    sliderCoords.top = sliderClientCoords.top + pageYOffset;
    sliderCoords.left = sliderClientCoords.left + pageXOffset;

    let widthSlider = slider.offsetWidth - item.offsetWidth;
    let initIndex = range.indexOf(initValue);
    item.style.left = widthSlider * (initIndex * step / 100) + 'px';
    progress.style.width = widthSlider * (initIndex * step / 100) + 'px';

    item.onmousedown = function(e) {
      item.ondragstart = function() {
        return false;
      };
      
      let itemClientCoords = item.getBoundingClientRect();
      let itemCoords = {};
      itemCoords.top = itemClientCoords.top + pageYOffset;
      itemCoords.left = itemClientCoords.left + pageXOffset;
      
      let right = slider.offsetWidth - item.offsetWidth;
      
      let shiftX = e.pageX - itemCoords.left;
      
      document.onmousemove = function(e){
        let newLeft = e.pageX - sliderCoords.left - shiftX;
        if (newLeft < 0) newLeft = 0;
        if (newLeft > right) newLeft = right;
        let percent = Math.round(newLeft / right * 100);
        let label = 0;
        stepRanges.forEach(function(item, index) {
          if (percent >= item.start && percent <= item.end) {
            percent = index * step;
            label = item.value + (item.value > 4 ? ' ядер' : ' ядра');
            currentFilters.sliderCores = item.value;
            render(isLoading, configurationList, currentFilters);
          }
        });
        item.style.left = right * (percent / 100) + 'px';
        progress.style.width = right * (percent / 100) + 'px';
      }
      
      document.onmouseup = function(){
        document.onmousemove = document.onmouseup = null;
      }
  
      return false;
    }
  };

  initSlider(currentFilters.sliderCores);

  document.getElementById('js_filter_gpu').addEventListener('click', function(event) {
    currentFilters.checkboxGpu = event.currentTarget.checked;
    render(isLoading, configurationList, currentFilters);
  });

  document.getElementById('js_filter_raid').addEventListener('click', function(event) {
    currentFilters.checkboxRaid = event.currentTarget.checked;
    render(isLoading, configurationList, currentFilters);
  });

  document.getElementById('js_filter_ssd').addEventListener('click', function(event) {
    currentFilters.checkboxSsd = event.currentTarget.checked;
    render(isLoading, configurationList, currentFilters);
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
          render(isLoading, configurationList, currentFilters);
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
