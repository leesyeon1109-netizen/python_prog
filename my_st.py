import streamlit as st

#타이틀 텍스트 출력
st.title('첫번째 웹 어플 만들기😀👩🏻‍💻')

st.write('# 이것이 제목 :smile::sunglasses:')
'이것은 그냥 문자열'
st.write('## 이것이 부제목 :smile::sunglasses:')
st.write('### 이것이 소제목 :smile::sunglasses:')
st.write('#### 이것이 4단계 :smile::sunglasses:')
st.write('##### 이것이 5단계 :smile::sunglasses:')
st.write('###### 이것이 6단계 :smile::sunglasses:')
st.caption('이것이 캡션 :smile::sunglasses:')

st.divider() #구분선
'''
# 이것이 제목 :smile::sunglasses:
이것은 그냥 문자열  
### 지금부터 코드

```
import streamlit as st
import pandas
a = 3
b = 5
print(a+b)
```

## 이것이 부제목 :smile::sunglasses:
'''
456

st.divider() #구분선

'### with st.echo(): 코드와 결과를 같이 보여주는 블록'
with st.echo():
    #이 블록의 코드와 결과를 출력
    name = 'LeeSY'
    st.write('Hello, Streamlit! My name is', name)
    123
    'Hello, Streamlit! My name is', name
    word = 'word'
    word

st.divider() #구분선

r'''
### 마크다운에 수식 넣는 방법
- 본문에 포함  
$$E=mc^2$$  
$$\alpha + \beta = \gamma$$

### 마크다운 :yellow[작성법]
- ~지우기~
- **굵게**
- *기울임*
- ***굵고 기울임***
- > 인용문
- `코드`
1. 순서 있는 리스트
    1. 하위 리스트
    - 하위 리스트
1. :red[숫자랑 점만 입력해도] 순서 있는 리스트로 인식  
[링크 텍스트 네이버](https://www.naver.com)
'''

'# 🎥: 이미지 오디오 동영상'

'#### :orange[이미지: st.image()]'
st.image('./data/img_pythonlogo.png', caption='파이썬 로고', width=200)

'#### :orange[오디오: st.audio()]'
st.audio('./data/music.mp3', format="audio/mp3", loop=True)

'#### :orange[동영상: st.video()]'
#'rb'은 read binary의 약자, 바이너리 파일을 읽는 모드
video_file = open('./data/sea_video.mp4', 'rb')
video_bytes = video_file.read()

st.video(video_bytes)

st.divider()

'# 💡콜아웃'

'#### :orange[정보: st.info()]'
st.info(
    icon="ℹ️",
    body='''
    **정보 콜아웃**은 중요한 정보를 강조하는 데 사용됩니다.
    - :red[빨간색 텍스트]
        - :green[초록색 텍스트]
    - :blue[파란색 텍스트]
        - :yellow[노란색 텍스트]
    - :orange[주황색 텍스트]
        - :gray[회색 텍스트]
'''
)

'#### :orange[경고: st.warning()]'
st.warning('**경고 콜아웃**은 사용자에게 주의를 환기시키는 데 사용됩니다.', icon="⚠️")

'#### :orange[오류: st.error()]'
st.error('**오류 콜아웃**은 심각한 문제나 오류를 나타내는 데 사용됩니다.', icon="❌")

'#### :orange[성공: st.success()]'
st.success('**성공 콜아웃**은 작업이 성공적으로 완료되었음을 나타내는 데 사용됩니다.', icon="✅")

st.divider()

'# 📊 데이터 테이블'
'#### :orange[Pandas DataFrame]'
import pandas as pd
df = pd.DataFrame(
    {
        '이름': ['Alice', 'Bob', 'Charlie'],
        '나이': [25, 30, 35],
        '도시': ['서울', '부산', '대구']
    }
)
df  #데이터프레임 출력

'''
#### :blue[마크다운 테이블]
| 이름 | 나이 | 도시 |
|----|----|----|
| Alice | 25 | 서울 |
| Bob   | 30 | 부산 |
| Charlie | 35 | 대구 |'''

'#### :orange[지표(Metric)]'
col1, col2, col3, col4 = st.columns(4) #4개의 컬럼 생성
col1.metric("Temperature", "25 °C", "1.2 °C")
col2.metric("Humidity", "60 %", "-5 %")
col3.metric("Wind", "15 km/h", "2 km/h")
col4.metric("Heart Rate", "88 bpm", "-7 bpm")

st.metric(label="Stock Price", value="$120", delta="+5%")

'# 📈 Streamlit 그래프'
import pandas as pd
import numpy as np

chart_data = pd.DataFrame(
    np.random.randn(20, 3),
    columns=['A', 'B', 'C']
    )

'#### :orange[st.area_chart()]'
st.area_chart(chart_data)

'#### :orange[st.bar_chart()]'
st.bar_chart(chart_data)

'#### :orange[st.line_chart()]'
st.line_chart(chart_data)

'#### :orange[st.scatter_chart()]'
st.scatter_chart(chart_data)

'#### :orange[st.map()]'
df = pd.DataFrame(
    np.random.randn(100, 2) / [100, 100] + [37.55, 126.92],
    columns=['lat', 'lon']
)
st.map(df)

st.divider()

'# :blue[시각화 라이브러리]'

'#### :orange[Matplotlib: st.pyplot()]'
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

fig, ax = plt.subplots()
ax.plot(x,y)
st.pyplot(fig) # 차트 출력
