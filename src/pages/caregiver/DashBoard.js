import React, { useState, useEffect } from 'react';
import { getUserSession } from "../../utils/auth";
import Navigate from "../../common/component/Navigate";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

const Dashboard = () => {
    const [checklistData, setChecklistData] = useState(null);
    const [selectedVital, setSelectedVital] = useState('bloodPressure');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const userInfo = getUserSession();

    const getCharacterImage = (status) => {
        const imageTypes = {
            '좋음': 'Excellent-green',
            '보통': 'Neutral-yellow',
            '나쁨': 'Poor-red'
        };
        return `/img/marimo/${imageTypes[status] || 'Neutral-yellow'}.png`;
    };

    const fetchData = async (date) => {
        try {
            setIsLoading(true);
            const formattedDate = date.toISOString().split('T')[0];
            const patientCode = userInfo?.patientInfo?.code || userInfo?.code;

            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/patient/daily-check/get/checklist?date=${formattedDate}&code=${patientCode}`,
                { headers: { 'accept': '*/*' } }
            );

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setChecklistData(result.data);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo) {
            fetchData(selectedDate);
        }
    }, []);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setIsDatePickerOpen(false);
        fetchData(date);
    };

    const formatDate = (date) => {
        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const vitalLabels = {
        bloodPressure: { name: '혈압', unit: 'mmHg' },
        oxygen: { name: '산소포화도', unit: '%' },
        temperature: { name: '체온', unit: '°C' },
        pulse: { name: '맥박', unit: 'bpm' }
    };

    const getCurrentValue = () => {
        if (!checklistData?.vitalSigns) return '--';

        const vitalSigns = checklistData.vitalSigns;
        switch (selectedVital) {
            case 'bloodPressure':
                return `${vitalSigns.bloodPressureSys}/${vitalSigns.bloodPressureDia}`;
            case 'oxygen':
                return vitalSigns.oxygen;
            case 'temperature':
                return vitalSigns.temperature;
            case 'pulse':
                return vitalSigns.pulse;
            default:
                return '--';
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 shadow-md rounded-md">
                    <p className="text-sm">
                        {`${payload[0].payload.date}: ${payload[0].value} ${vitalLabels[selectedVital].unit}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">데이터를 불러오는 중입니다...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{background: '#F5F5F5'}}>
            <header className="fixed top-0 left-0 right-0 z-10 p-4 text-center border-b" style={{background: '#F5F5F5'}}>
                <h1 className="text-xl font-medium">대시보드</h1>
            </header>

            <main className="pt-16 pb-20 px-4">
                {/* 캐릭터 섹션 */}
                <div className="flex justify-center my-8">
                    <img
                        src={getCharacterImage(checklistData?.dailyCheckList?.analysisWord)}
                        alt="Character"
                        className="w-34 h-44"
                    />
                </div>

                {/* AI 분석 결과 */}
                <div className="bg-white rounded-2xl p-4 mb-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">{formatDate(selectedDate)}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">AI</span>
                    </div>
                    <p className="text-sm">
                        {checklistData?.dailyCheckList?.analysisData || '분석 결과가 없습니다.'}
                    </p>
                </div>

                {/* 생체 지표 그래프 카드 */}
                <div className="bg-white rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{vitalLabels[selectedVital].name}</span>
                            <span className="text-red-500 text-sm">▲ 1.2%</span>
                        </div>
                        <div>
                            <div className="text-2xl font-medium">
                                {getCurrentValue()}
                                <span className="text-sm text-gray-500 ml-1">
                                    {vitalLabels[selectedVital].unit}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 필터 버튼 */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {Object.entries(vitalLabels).map(([key, value]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedVital(key)}
                                className={`px-3 py-1 rounded-full text-sm ${
                                    selectedVital === key
                                        ? 'bg-[#496E1B] text-white'
                                        : 'bg-gray-200 text-gray-600'
                                }`}
                            >
                                {value.name}
                            </button>
                        ))}
                    </div>

                    {/* 그래프 */}
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={[]} 
                                margin={{top: 10, right: 10, left: -20, bottom: 0}}
                            >
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#496E1B" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#496E1B" stopOpacity={0.01}/>
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{fontSize: 12}}
                                />
                                <YAxis hide={true} domain={['dataMin - 10', 'dataMax + 10']}/>
                                <Tooltip content={<CustomTooltip/>}/>
                                <ReferenceLine
                                    y={120}
                                    stroke="#496E1B"
                                    strokeDasharray="3 3"
                                    strokeOpacity={0.5}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#496E1B"
                                    fill="url(#colorValue)"
                                    strokeWidth={2}
                                    dot={{fill: '#496E1B', r: 4}}
                                    activeDot={{r: 6, fill: '#496E1B'}}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 환자 분석 */}
                <div className="bg-[#F6FFF3] rounded-2xl p-4 mb-4">
                    <h3 className="font-medium mb-3">환자 분석</h3>
                    <ul className="text-sm space-y-2 text-gray-600">
                        {checklistData?.dailyCheckList?.analysisFullData?.split('\n')?.map((line, index) => (
                            <li key={index}>• {line}</li>
                        )) || <li>• 분석 데이터가 없습니다.</li>}
                    </ul>
                </div>

                {/* 하단 버튼 */}
                <div className="flex gap-4">
                    <button 
                        onClick={() => setIsDatePickerOpen(true)}
                        className="flex-1 py-4 bg-white rounded-xl text-[#496E1B]"
                    >
                        일일 진단 보기
                    </button>
                    <button className="flex-1 py-4 bg-white rounded-xl text-[#496E1B]">
                        병원에 전송하기
                    </button>
                </div>
            </main>

            {/* 날짜 선택 모달 */}
            {isDatePickerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-[90%] max-w-md">
                        <h3 className="text-lg font-medium mb-4">날짜 선택</h3>
                        <input
                            type="date"
                            value={selectedDate.toISOString().split('T')[0]}
                            onChange={(e) => {
                                handleDateSelect(new Date(e.target.value));
                            }}
                            className="w-full p-3 border rounded-xl mb-4 focus:outline-none focus:border-[#496E1B]"
                        />
                        <button
                            onClick={() => setIsDatePickerOpen(false)}
                            className="w-full py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            <Navigate/>
        </div>
    );
};

export default Dashboard;
